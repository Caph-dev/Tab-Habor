'use strict';

(function attachDrawerSyncStore(globalScope) {
  const SCHEMA_VERSION = 1;
  const LOCAL_SAVED_KEY = 'deferred';
  const LOCAL_TODOS_KEY = 'todos';
  const META_KEY = 'tabHarbor.drawer.meta';
  const SAVED_ITEM_PREFIX = 'tabHarbor.saved.item.';
  const SAVED_ORDER_KEY = 'tabHarbor.saved.order';
  const TODO_ITEM_PREFIX = 'tabHarbor.todo.item.';
  const TODO_ORDER_KEY = 'tabHarbor.todo.order';
  const DRAWER_SYNC_PREFIXES = [
    'tabHarbor.saved.',
    'tabHarbor.todo.',
    META_KEY,
  ];

  let drawerSyncInitPromise = null;
  let drawerSyncInitialized = false;
  let drawerSyncListenerAttached = false;
  let drawerSyncRefreshTimer = 0;
  let lastSyncError = null;

  function nowIso() {
    return new Date().toISOString();
  }

  function asString(value, fallback = '') {
    const next = String(value || '').trim();
    return next || fallback;
  }

  function getTimestampMs(value) {
    const parsed = Date.parse(value || '');
    return Number.isFinite(parsed) ? parsed : 0;
  }

  function latestTimestamp(...values) {
    const winner = values
      .map(value => ({ value, ms: getTimestampMs(value) }))
      .sort((a, b) => b.ms - a.ms)[0];
    return winner?.value || '';
  }

  function isTombstone(item) {
    return Boolean(item?.deletedAt || item?.dismissed);
  }

  function withUpdatedAt(item, fallbackTime = nowIso()) {
    return {
      ...item,
      updatedAt: item.updatedAt || latestTimestamp(
        item.deletedAt,
        item.completedAt,
        item.savedAt,
        item.createdAt
      ) || fallbackTime,
    };
  }

  function normalizeSavedItem(item, fallbackTime = nowIso()) {
    if (!item || !item.id) return null;

    const deletedAt = item.deletedAt || null;
    const dismissed = Boolean(item.dismissed || deletedAt);
    const url = asString(item.url);
    if (!url && !dismissed) return null;

    return withUpdatedAt({
      id: String(item.id),
      url,
      title: asString(item.title, url),
      savedAt: item.savedAt || fallbackTime,
      completed: Boolean(item.completed),
      completedAt: item.completedAt || null,
      dismissed,
      deletedAt,
      updatedAt: item.updatedAt || null,
    }, fallbackTime);
  }

  function normalizeSavedItems(input, fallbackTime = nowIso()) {
    if (!Array.isArray(input)) return [];
    const seen = new Set();
    const items = [];

    for (const item of input) {
      const normalized = normalizeSavedItem(item, fallbackTime);
      if (!normalized || seen.has(normalized.id)) continue;
      seen.add(normalized.id);
      items.push(normalized);
    }

    return items;
  }

  function normalizeTodoItem(item, fallbackTime = nowIso()) {
    if (!item || !item.id) return null;

    const deletedAt = item.deletedAt || null;
    const dismissed = Boolean(item.dismissed || deletedAt);
    const title = asString(item.title);
    if (!title && !dismissed) return null;

    return withUpdatedAt({
      id: String(item.id),
      title,
      description: String(item.description || '').trim(),
      createdAt: item.createdAt || fallbackTime,
      completed: Boolean(item.completed),
      completedAt: item.completedAt || null,
      dismissed,
      deletedAt,
      updatedAt: item.updatedAt || null,
    }, fallbackTime);
  }

  function normalizeTodoItems(input, fallbackTime = nowIso()) {
    if (!Array.isArray(input)) return [];
    const seen = new Set();
    const items = [];

    for (const item of input) {
      const normalized = normalizeTodoItem(item, fallbackTime);
      if (!normalized || seen.has(normalized.id)) continue;
      seen.add(normalized.id);
      items.push(normalized);
    }

    return items;
  }

  function normalizeOrder(order) {
    const ids = Array.isArray(order?.ids)
      ? [...new Set(order.ids.map(id => String(id)).filter(Boolean))]
      : [];
    return {
      ids,
      updatedAt: order?.updatedAt || '',
    };
  }

  function itemUpdatedAtMs(item) {
    return getTimestampMs(item?.updatedAt) ||
      getTimestampMs(item?.deletedAt) ||
      getTimestampMs(item?.completedAt) ||
      getTimestampMs(item?.savedAt) ||
      getTimestampMs(item?.createdAt);
  }

  function chooseItemWinner(existingItem, candidateItem) {
    if (!existingItem) return candidateItem;
    if (!candidateItem) return existingItem;

    const existingMs = itemUpdatedAtMs(existingItem);
    const candidateMs = itemUpdatedAtMs(candidateItem);
    if (candidateMs > existingMs) return candidateItem;
    if (candidateMs < existingMs) return existingItem;

    if (isTombstone(candidateItem) && !isTombstone(existingItem)) return candidateItem;
    return existingItem;
  }

  function mergeItems(syncItems, localItems, { migratedAt = '' } = {}) {
    const merged = new Map();
    const migratedAtMs = getTimestampMs(migratedAt);

    for (const item of syncItems) {
      merged.set(item.id, chooseItemWinner(merged.get(item.id), item));
    }
    for (const item of localItems) {
      if (!merged.has(item.id) && migratedAtMs && itemUpdatedAtMs(item) <= migratedAtMs) continue;
      merged.set(item.id, chooseItemWinner(merged.get(item.id), item));
    }

    return [...merged.values()];
  }

  function chooseOrder(syncOrder, localOrder, localItems) {
    const normalizedSyncOrder = normalizeOrder(syncOrder);
    const normalizedLocalOrder = normalizeOrder(localOrder);
    const fallbackLocalOrder = {
      ids: localItems.map(item => item.id).filter(Boolean),
      updatedAt: latestTimestamp(...localItems.map(item => item.updatedAt)),
    };
    const effectiveLocalOrder = normalizedLocalOrder.ids.length ? normalizedLocalOrder : fallbackLocalOrder;

    if (!normalizedSyncOrder.ids.length) return effectiveLocalOrder;
    if (!effectiveLocalOrder.ids.length) return normalizedSyncOrder;
    if (getTimestampMs(effectiveLocalOrder.updatedAt) > getTimestampMs(normalizedSyncOrder.updatedAt)) {
      return effectiveLocalOrder;
    }
    return normalizedSyncOrder;
  }

  function applyOrder(items, order) {
    const normalizedOrder = normalizeOrder(order);
    const itemMap = new Map(items.map(item => [item.id, item]));
    const ordered = [];
    const used = new Set();

    for (const id of normalizedOrder.ids) {
      const item = itemMap.get(id);
      if (!item || used.has(id)) continue;
      ordered.push(item);
      used.add(id);
    }

    const unordered = items
      .filter(item => !used.has(item.id))
      .sort((a, b) => itemUpdatedAtMs(a) - itemUpdatedAtMs(b));

    return [...ordered, ...unordered];
  }

  function buildOrder(items, updatedAt = nowIso()) {
    return {
      ids: [...new Set((Array.isArray(items) ? items : []).map(item => String(item?.id || '')).filter(Boolean))],
      updatedAt,
    };
  }

  function reorderSubsetByIds(items, orderIds, includeItem) {
    if (!Array.isArray(items)) return [];

    const list = items.slice();
    const shouldInclude = typeof includeItem === 'function' ? includeItem : () => true;
    const subset = list.filter(shouldInclude);
    const normalizedOrder = Array.isArray(orderIds)
      ? orderIds.map(id => String(id)).filter(Boolean)
      : [];
    if (!subset.length || subset.length !== normalizedOrder.length) return list;

    const subsetMap = new Map(subset.map(item => [String(item.id), item]));
    if (subsetMap.size !== subset.length) return list;
    if (normalizedOrder.some(id => !subsetMap.has(id))) return list;

    let nextIndex = 0;
    return list.map(item => {
      if (!shouldInclude(item)) return item;
      const nextItem = subsetMap.get(normalizedOrder[nextIndex]);
      nextIndex += 1;
      return nextItem || item;
    });
  }

  function getStorageArea(areaName) {
    return globalScope.chrome?.storage?.[areaName] || null;
  }

  async function storageGet(areaName, keys) {
    const area = getStorageArea(areaName);
    if (!area?.get) return {};
    return area.get(keys);
  }

  async function storageSet(areaName, items) {
    const area = getStorageArea(areaName);
    if (!area?.set) return false;
    await area.set(items);
    return true;
  }

  function getSyncKeyForItem(prefix, id) {
    return `${prefix}${String(id)}`;
  }

  function extractItemsFromSync(syncData, prefix, normalizeItem) {
    return Object.entries(syncData || {})
      .filter(([key]) => key.startsWith(prefix))
      .map(([, value]) => normalizeItem(value))
      .filter(Boolean);
  }

  async function readLocalState() {
    const local = await storageGet('local', [
      LOCAL_SAVED_KEY,
      LOCAL_TODOS_KEY,
      SAVED_ORDER_KEY,
      TODO_ORDER_KEY,
    ]);
    return {
      saved: normalizeSavedItems(local[LOCAL_SAVED_KEY]),
      todos: normalizeTodoItems(local[LOCAL_TODOS_KEY]),
      savedOrder: normalizeOrder(local[SAVED_ORDER_KEY]),
      todoOrder: normalizeOrder(local[TODO_ORDER_KEY]),
    };
  }

  async function readSyncState() {
    const syncData = await storageGet('sync', null);
    return {
      raw: syncData || {},
      meta: syncData?.[META_KEY] || null,
      savedItems: extractItemsFromSync(syncData, SAVED_ITEM_PREFIX, normalizeSavedItem),
      savedOrder: normalizeOrder(syncData?.[SAVED_ORDER_KEY]),
      todoItems: extractItemsFromSync(syncData, TODO_ITEM_PREFIX, normalizeTodoItem),
      todoOrder: normalizeOrder(syncData?.[TODO_ORDER_KEY]),
    };
  }

  async function writeLocalCaches({ saved, todos, savedOrder, todoOrder }) {
    const patch = {};
    if (Array.isArray(saved)) patch[LOCAL_SAVED_KEY] = normalizeSavedItems(saved);
    if (Array.isArray(todos)) patch[LOCAL_TODOS_KEY] = normalizeTodoItems(todos);
    if (savedOrder) patch[SAVED_ORDER_KEY] = normalizeOrder(savedOrder);
    if (todoOrder) patch[TODO_ORDER_KEY] = normalizeOrder(todoOrder);
    if (!Object.keys(patch).length) return;
    await storageSet('local', patch);
  }

  function dispatchDrawerSyncEvent(type, detail = {}) {
    if (typeof globalScope.dispatchEvent !== 'function') return;
    try {
      const event = typeof globalScope.CustomEvent === 'function'
        ? new globalScope.CustomEvent(type, { detail })
        : { type, detail };
      globalScope.dispatchEvent(event);
    } catch {
      // Best-effort UI notification only.
    }
  }

  function rememberSyncError(error, context) {
    lastSyncError = {
      context,
      message: error?.message || String(error || 'Chrome Sync update failed'),
      at: nowIso(),
    };
    console.warn('[tab-harbor] Chrome Sync update failed:', error);
    dispatchDrawerSyncEvent('tabharbor-drawer-sync-error', lastSyncError);
  }

  async function writeSyncPatch(patch, context) {
    if (!Object.keys(patch || {}).length) return true;

    try {
      const wrote = await storageSet('sync', patch);
      if (!wrote) throw new Error('chrome.storage.sync is unavailable');
      return true;
    } catch (error) {
      rememberSyncError(error, context);
      return false;
    }
  }

  function buildSyncSnapshotPatch({ saved, todos, savedOrder, todoOrder, meta }) {
    const patch = {};
    for (const item of normalizeSavedItems(saved)) {
      patch[getSyncKeyForItem(SAVED_ITEM_PREFIX, item.id)] = item;
    }
    for (const item of normalizeTodoItems(todos)) {
      patch[getSyncKeyForItem(TODO_ITEM_PREFIX, item.id)] = item;
    }
    if (savedOrder) patch[SAVED_ORDER_KEY] = normalizeOrder(savedOrder);
    if (todoOrder) patch[TODO_ORDER_KEY] = normalizeOrder(todoOrder);
    if (meta) patch[META_KEY] = meta;
    return patch;
  }

  function hasAnySyncDrawerData(syncState) {
    return Boolean(
      syncState.meta ||
      syncState.savedItems.length ||
      syncState.todoItems.length ||
      syncState.savedOrder.ids.length ||
      syncState.todoOrder.ids.length
    );
  }

  async function migrateLegacyLocalToSync() {
    const syncState = await readSyncState();
    if (syncState.meta) return;

    const localState = await readLocalState();
    if (!localState.saved.length && !localState.todos.length && !hasAnySyncDrawerData(syncState)) {
      await writeSyncPatch({
        [META_KEY]: {
          schemaVersion: SCHEMA_VERSION,
          migratedAt: nowIso(),
        },
      }, 'migration');
      return;
    }

    const saved = mergeItems(syncState.savedItems, localState.saved);
    const todos = mergeItems(syncState.todoItems, localState.todos);
    const savedOrder = chooseOrder(syncState.savedOrder, localState.savedOrder, localState.saved);
    const todoOrder = chooseOrder(syncState.todoOrder, localState.todoOrder, localState.todos);
    const migratedAt = nowIso();

    await writeSyncPatch(buildSyncSnapshotPatch({
      saved,
      todos,
      savedOrder: {
        ids: applyOrder(saved, savedOrder).map(item => item.id),
        updatedAt: savedOrder.updatedAt || migratedAt,
      },
      todoOrder: {
        ids: applyOrder(todos, todoOrder).map(item => item.id),
        updatedAt: todoOrder.updatedAt || migratedAt,
      },
      meta: {
        schemaVersion: SCHEMA_VERSION,
        migratedAt,
      },
    }), 'migration');
  }

  async function refreshLocalCacheFromSync({ dispatchUpdate = false } = {}) {
    const [syncState, localState] = await Promise.all([
      readSyncState(),
      readLocalState(),
    ]);

    const mergeOptions = { migratedAt: syncState.meta?.migratedAt || '' };
    const savedMerged = mergeItems(syncState.savedItems, localState.saved, mergeOptions);
    const todosMerged = mergeItems(syncState.todoItems, localState.todos, mergeOptions);
    const savedOrder = chooseOrder(syncState.savedOrder, localState.savedOrder, localState.saved);
    const todoOrder = chooseOrder(syncState.todoOrder, localState.todoOrder, localState.todos);
    const saved = applyOrder(savedMerged, savedOrder);
    const todos = applyOrder(todosMerged, todoOrder);

    await writeLocalCaches({ saved, todos, savedOrder, todoOrder });

    if (dispatchUpdate) {
      dispatchDrawerSyncEvent('tabharbor-drawer-sync-updated', {
        savedCount: saved.length,
        todoCount: todos.length,
      });
    }

    return { saved, todos };
  }

  function isDrawerSyncChange(changes) {
    return Object.keys(changes || {}).some(key =>
      DRAWER_SYNC_PREFIXES.some(prefix => key === prefix || key.startsWith(prefix))
    );
  }

  function attachSyncChangeListener() {
    if (drawerSyncListenerAttached) return;
    const storageEvents = globalScope.chrome?.storage?.onChanged;
    if (!storageEvents?.addListener) return;

    storageEvents.addListener((changes, areaName) => {
      if (areaName !== 'sync' || !isDrawerSyncChange(changes)) return;
      if (drawerSyncRefreshTimer) clearTimeout(drawerSyncRefreshTimer);
      drawerSyncRefreshTimer = setTimeout(() => {
        drawerSyncRefreshTimer = 0;
        void refreshLocalCacheFromSync({ dispatchUpdate: true });
      }, 80);
    });
    drawerSyncListenerAttached = true;
  }

  async function initDrawerSync() {
    if (drawerSyncInitialized) return refreshLocalCacheFromSync();
    if (drawerSyncInitPromise) return drawerSyncInitPromise;

    drawerSyncInitPromise = (async () => {
      try {
        await migrateLegacyLocalToSync();
      } catch (error) {
        rememberSyncError(error, 'migration');
      }

      const result = await refreshLocalCacheFromSync();
      attachSyncChangeListener();
      drawerSyncInitialized = true;
      return result;
    })().finally(() => {
      drawerSyncInitPromise = null;
    });

    return drawerSyncInitPromise;
  }

  async function getSavedTabs() {
    const local = await storageGet('local', LOCAL_SAVED_KEY);
    return normalizeSavedItems(local[LOCAL_SAVED_KEY]);
  }

  async function getTodos() {
    const local = await storageGet('local', LOCAL_TODOS_KEY);
    return normalizeTodoItems(local[LOCAL_TODOS_KEY]);
  }

  async function saveTabForLater(tab) {
    if (!tab?.url) throw new Error('Saved tab URL is required');

    const saved = await getSavedTabs();
    const timestamp = nowIso();
    const item = normalizeSavedItem({
      id: `saved-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      url: tab.url,
      title: tab.title || tab.url,
      savedAt: timestamp,
      completed: false,
      completedAt: null,
      dismissed: false,
      deletedAt: null,
      updatedAt: timestamp,
    }, timestamp);
    const nextSaved = [...saved, item];
    const savedOrder = buildOrder(nextSaved, timestamp);

    await writeLocalCaches({ saved: nextSaved, savedOrder });
    await writeSyncPatch({
      [getSyncKeyForItem(SAVED_ITEM_PREFIX, item.id)]: item,
      [SAVED_ORDER_KEY]: savedOrder,
    }, 'save-tab');

    return nextSaved;
  }

  async function updateSavedTab(id, updates = {}) {
    const saved = await getSavedTabs();
    const targetId = String(id || '');
    const timestamp = nowIso();
    let didUpdate = false;
    const nextSaved = saved.map(item => {
      if (item.id !== targetId) return item;
      didUpdate = true;
      return normalizeSavedItem({
        ...item,
        ...updates,
        updatedAt: timestamp,
      }, timestamp);
    }).filter(Boolean);

    if (!didUpdate) return saved;

    const updatedItem = nextSaved.find(item => item.id === targetId);
    await writeLocalCaches({ saved: nextSaved });
    await writeSyncPatch({
      [getSyncKeyForItem(SAVED_ITEM_PREFIX, targetId)]: updatedItem,
    }, 'update-saved-tab');

    return nextSaved;
  }

  async function reorderSavedTabs(orderIds) {
    const saved = await getSavedTabs();
    const timestamp = nowIso();
    const nextSaved = reorderSubsetByIds(
      saved,
      orderIds,
      item => item && item.id && !item.completed && !item.dismissed && !item.deletedAt
    );

    const savedOrder = buildOrder(nextSaved, timestamp);
    await writeLocalCaches({ saved: nextSaved, savedOrder });
    await writeSyncPatch({
      [SAVED_ORDER_KEY]: savedOrder,
    }, 'reorder-saved-tabs');

    return nextSaved;
  }

  async function saveTodo(payload = {}) {
    const title = asString(payload.title);
    if (!title) throw new Error('Todo title is required');

    const todos = await getTodos();
    const timestamp = nowIso();
    const item = normalizeTodoItem({
      id: payload.id || `todo-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      title,
      description: payload.description || '',
      createdAt: payload.createdAt || timestamp,
      completed: false,
      completedAt: null,
      dismissed: false,
      deletedAt: null,
      updatedAt: timestamp,
    }, timestamp);
    const nextTodos = [...todos, item];

    const todoOrder = buildOrder(nextTodos, timestamp);
    await writeLocalCaches({ todos: nextTodos, todoOrder });
    await writeSyncPatch({
      [getSyncKeyForItem(TODO_ITEM_PREFIX, item.id)]: item,
      [TODO_ORDER_KEY]: todoOrder,
    }, 'save-todo');

    return nextTodos;
  }

  async function updateTodo(id, updates = {}) {
    const todos = await getTodos();
    const targetId = String(id || '');
    const timestamp = nowIso();
    let didUpdate = false;
    const nextTodos = todos.map(todo => {
      if (todo.id !== targetId) return todo;
      didUpdate = true;
      return normalizeTodoItem({
        ...todo,
        ...updates,
        updatedAt: timestamp,
      }, timestamp);
    }).filter(Boolean);

    if (!didUpdate) return todos;

    const updatedTodo = nextTodos.find(todo => todo.id === targetId);
    await writeLocalCaches({ todos: nextTodos });
    await writeSyncPatch({
      [getSyncKeyForItem(TODO_ITEM_PREFIX, targetId)]: updatedTodo,
    }, 'update-todo');

    return nextTodos;
  }

  async function reorderTodos(orderIds) {
    const todos = await getTodos();
    const timestamp = nowIso();
    const nextTodos = reorderSubsetByIds(
      todos,
      orderIds,
      todo => todo && todo.id && !todo.completed && !todo.dismissed && !todo.deletedAt
    );

    const todoOrder = buildOrder(nextTodos, timestamp);
    await writeLocalCaches({ todos: nextTodos, todoOrder });
    await writeSyncPatch({
      [TODO_ORDER_KEY]: todoOrder,
    }, 'reorder-todos');

    return nextTodos;
  }

  function getLastSyncError() {
    return lastSyncError;
  }

  const api = {
    initDrawerSync,
    getSavedTabs,
    saveTabForLater,
    updateSavedTab,
    reorderSavedTabs,
    getTodos,
    saveTodo,
    updateTodo,
    reorderTodos,
    getLastSyncError,
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }

  globalScope.TabHarborDrawerSyncStore = api;
})(typeof globalThis !== 'undefined' ? globalThis : window);
