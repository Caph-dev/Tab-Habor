'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

function createEventEmitter() {
  const listeners = new Set();
  return {
    addListener(listener) {
      listeners.add(listener);
    },
    emit(...args) {
      for (const listener of [...listeners]) listener(...args);
    },
  };
}

function createChromeMock({ local = {}, sync = {}, failSyncSet = false } = {}) {
  const onChanged = createEventEmitter();
  const stores = {
    local: { ...local },
    sync: { ...sync },
  };

  function readStore(areaName, keys) {
    const store = stores[areaName];
    if (keys == null) return { ...store };
    if (Array.isArray(keys)) {
      return Object.fromEntries(keys.map(key => [key, store[key]]));
    }
    if (typeof keys === 'string') return { [keys]: store[keys] };
    if (keys && typeof keys === 'object') {
      return Object.fromEntries(Object.keys(keys).map(key => [key, store[key] ?? keys[key]]));
    }
    return {};
  }

  function writeStore(areaName, patch) {
    if (areaName === 'sync' && failSyncSet) {
      throw new Error('QUOTA_BYTES exceeded');
    }

    const changes = {};
    for (const [key, value] of Object.entries(patch)) {
      changes[key] = {
        oldValue: stores[areaName][key],
        newValue: value,
      };
      stores[areaName][key] = value;
    }
    onChanged.emit(changes, areaName);
  }

  return {
    stores,
    chrome: {
      storage: {
        local: {
          get: async keys => readStore('local', keys),
          set: async patch => writeStore('local', patch),
        },
        sync: {
          get: async keys => readStore('sync', keys),
          set: async patch => writeStore('sync', patch),
        },
        onChanged,
      },
    },
  };
}

function loadStore(mockOptions) {
  delete require.cache[require.resolve('./drawer-sync-store.js')];
  delete globalThis.TabHarborDrawerSyncStore;
  const mock = createChromeMock(mockOptions);
  globalThis.chrome = mock.chrome;
  globalThis.addEventListener = () => {};
  globalThis.dispatchEvent = () => {};
  globalThis.CustomEvent = function CustomEvent(type, init) {
    return { type, detail: init?.detail };
  };
  const api = require('./drawer-sync-store.js');
  return { ...mock, api };
}

test('legacy deferred migrates into individual sync saved item keys', async () => {
  const { stores, api } = loadStore({
    local: {
      deferred: [
        {
          id: 'saved-1',
          url: 'https://example.com',
          title: 'Example',
          savedAt: '2026-01-01T00:00:00.000Z',
          completed: false,
          dismissed: false,
        },
      ],
    },
  });

  await api.initDrawerSync();

  assert.equal(stores.sync['tabHarbor.saved.item.saved-1'].url, 'https://example.com');
  assert.deepEqual(stores.sync['tabHarbor.saved.order'].ids, ['saved-1']);
  assert.equal(stores.sync['tabHarbor.drawer.meta'].schemaVersion, 1);
});

test('legacy todos migrate into individual sync todo item keys', async () => {
  const { stores, api } = loadStore({
    local: {
      todos: [
        {
          id: 'todo-1',
          title: 'Write notes',
          description: 'Draft sync plan',
          createdAt: '2026-01-01T00:00:00.000Z',
          completed: false,
          completedAt: null,
          dismissed: false,
        },
      ],
    },
  });

  await api.initDrawerSync();

  assert.equal(stores.sync['tabHarbor.todo.item.todo-1'].title, 'Write notes');
  assert.deepEqual(stores.sync['tabHarbor.todo.order'].ids, ['todo-1']);
  assert.equal(stores.local.todos[0].updatedAt, '2026-01-01T00:00:00.000Z');
});

test('split sync items merge back into local arrays by stored order', async () => {
  const { stores, api } = loadStore({
    sync: {
      'tabHarbor.drawer.meta': {
        schemaVersion: 1,
        migratedAt: '2026-01-01T00:00:00.000Z',
      },
      'tabHarbor.saved.item.a': {
        id: 'a',
        url: 'https://a.example',
        title: 'A',
        savedAt: '2026-01-02T00:00:00.000Z',
        completed: false,
        dismissed: false,
        updatedAt: '2026-01-02T00:00:00.000Z',
      },
      'tabHarbor.saved.item.b': {
        id: 'b',
        url: 'https://b.example',
        title: 'B',
        savedAt: '2026-01-03T00:00:00.000Z',
        completed: false,
        dismissed: false,
        updatedAt: '2026-01-03T00:00:00.000Z',
      },
      'tabHarbor.saved.order': {
        ids: ['b', 'a'],
        updatedAt: '2026-01-04T00:00:00.000Z',
      },
    },
  });

  await api.initDrawerSync();

  assert.deepEqual(stores.local.deferred.map(item => item.id), ['b', 'a']);
});

test('deleted saved tombstone is not revived from stale local cache', async () => {
  const { stores, api } = loadStore({
    local: {
      deferred: [
        {
          id: 'saved-1',
          url: 'https://old.example',
          title: 'Old local copy',
          savedAt: '2026-01-01T00:00:00.000Z',
          completed: false,
          dismissed: false,
          updatedAt: '2026-01-02T00:00:00.000Z',
        },
      ],
    },
    sync: {
      'tabHarbor.drawer.meta': {
        schemaVersion: 1,
        migratedAt: '2026-01-01T00:00:00.000Z',
      },
      'tabHarbor.saved.item.saved-1': {
        id: 'saved-1',
        url: 'https://old.example',
        title: 'Deleted',
        savedAt: '2026-01-01T00:00:00.000Z',
        completed: true,
        completedAt: '2026-01-03T00:00:00.000Z',
        dismissed: true,
        deletedAt: '2026-01-04T00:00:00.000Z',
        updatedAt: '2026-01-04T00:00:00.000Z',
      },
    },
  });

  await api.initDrawerSync();

  assert.equal(stores.local.deferred.length, 1);
  assert.equal(stores.local.deferred[0].dismissed, true);
  assert.equal(stores.local.deferred[0].deletedAt, '2026-01-04T00:00:00.000Z');
});

test('saved tab reorder writes sync order and updates local cache', async () => {
  const { stores, api } = loadStore({
    local: {
      deferred: [
        { id: 'a', url: 'https://a.example', title: 'A', savedAt: '2026-01-01T00:00:00.000Z', completed: false, dismissed: false },
        { id: 'b', url: 'https://b.example', title: 'B', savedAt: '2026-01-01T00:00:00.000Z', completed: false, dismissed: false },
      ],
    },
  });

  await api.initDrawerSync();
  await api.reorderSavedTabs(['b', 'a']);

  assert.deepEqual(stores.local.deferred.map(item => item.id), ['b', 'a']);
  assert.deepEqual(stores.sync['tabHarbor.saved.order'].ids, ['b', 'a']);
});

test('todo reorder writes sync order and updates local cache', async () => {
  const { stores, api } = loadStore({
    local: {
      todos: [
        { id: 'a', title: 'A', description: '', createdAt: '2026-01-01T00:00:00.000Z', completed: false, completedAt: null, dismissed: false },
        { id: 'b', title: 'B', description: '', createdAt: '2026-01-01T00:00:00.000Z', completed: false, completedAt: null, dismissed: false },
      ],
    },
  });

  await api.initDrawerSync();
  await api.reorderTodos(['b', 'a']);

  assert.deepEqual(stores.local.todos.map(item => item.id), ['b', 'a']);
  assert.deepEqual(stores.sync['tabHarbor.todo.order'].ids, ['b', 'a']);
});

test('newer updatedAt wins item conflict', async () => {
  const { stores, api } = loadStore({
    local: {
      todos: [
        {
          id: 'todo-1',
          title: 'New local title',
          description: '',
          createdAt: '2026-01-01T00:00:00.000Z',
          completed: false,
          completedAt: null,
          dismissed: false,
          updatedAt: '2026-01-05T00:00:00.000Z',
        },
      ],
    },
    sync: {
      'tabHarbor.drawer.meta': {
        schemaVersion: 1,
        migratedAt: '2026-01-01T00:00:00.000Z',
      },
      'tabHarbor.todo.item.todo-1': {
        id: 'todo-1',
        title: 'Old sync title',
        description: '',
        createdAt: '2026-01-01T00:00:00.000Z',
        completed: false,
        completedAt: null,
        dismissed: false,
        updatedAt: '2026-01-03T00:00:00.000Z',
      },
    },
  });

  await api.initDrawerSync();

  assert.equal(stores.local.todos[0].title, 'New local title');
});

test('sync write failure keeps local data and records an error', async () => {
  const { stores, api } = loadStore({ failSyncSet: true });

  await api.initDrawerSync();
  await api.saveTodo({ title: 'Local only', description: 'Sync quota failure' });

  assert.equal(stores.local.todos.length, 1);
  assert.equal(stores.local.todos[0].title, 'Local only');
  assert.equal(api.getLastSyncError().context, 'save-todo');
});

test('newer local saved order survives refresh when sync reorder write fails', async () => {
  const { stores, api } = loadStore({
    failSyncSet: true,
    local: {
      deferred: [
        { id: 'a', url: 'https://a.example', title: 'A', savedAt: '2026-01-01T00:00:00.000Z', completed: false, dismissed: false, updatedAt: '2026-01-01T00:00:00.000Z' },
        { id: 'b', url: 'https://b.example', title: 'B', savedAt: '2026-01-01T00:00:00.000Z', completed: false, dismissed: false, updatedAt: '2026-01-01T00:00:00.000Z' },
      ],
    },
    sync: {
      'tabHarbor.drawer.meta': {
        schemaVersion: 1,
        migratedAt: '2026-01-01T00:00:00.000Z',
      },
      'tabHarbor.saved.item.a': {
        id: 'a',
        url: 'https://a.example',
        title: 'A',
        savedAt: '2026-01-01T00:00:00.000Z',
        completed: false,
        dismissed: false,
        updatedAt: '2026-01-01T00:00:00.000Z',
      },
      'tabHarbor.saved.item.b': {
        id: 'b',
        url: 'https://b.example',
        title: 'B',
        savedAt: '2026-01-01T00:00:00.000Z',
        completed: false,
        dismissed: false,
        updatedAt: '2026-01-01T00:00:00.000Z',
      },
      'tabHarbor.saved.order': {
        ids: ['a', 'b'],
        updatedAt: '2026-01-02T00:00:00.000Z',
      },
    },
  });

  await api.initDrawerSync();
  await api.reorderSavedTabs(['b', 'a']);
  await api.initDrawerSync();

  assert.deepEqual(stores.local.deferred.map(item => item.id), ['b', 'a']);
  assert.deepEqual(stores.local['tabHarbor.saved.order'].ids, ['b', 'a']);
});
