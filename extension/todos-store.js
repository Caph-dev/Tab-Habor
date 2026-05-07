'use strict';

(function attachTodosStore(globalScope) {
  function normalizeTodos(input) {
    if (!Array.isArray(input)) return [];

    return input
      .filter(todo => todo && todo.id && todo.title)
      .map(todo => ({
        id: String(todo.id),
        title: String(todo.title).trim(),
        description: String(todo.description || ''),
        createdAt: todo.createdAt || new Date().toISOString(),
        completed: Boolean(todo.completed),
        completedAt: todo.completedAt || null,
        dismissed: Boolean(todo.dismissed),
        deletedAt: todo.deletedAt || null,
        updatedAt: todo.updatedAt || todo.deletedAt || todo.completedAt || todo.createdAt || new Date().toISOString(),
      }));
  }

  function createTodo(todos, { title, description = '' }) {
    const cleanTitle = String(title || '').trim();
    if (!cleanTitle) throw new Error('Todo title is required');

    const nextTodo = {
      id: `todo-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      title: cleanTitle,
      description: String(description || '').trim(),
      createdAt: new Date().toISOString(),
      completed: false,
      completedAt: null,
      dismissed: false,
    };

    return [...normalizeTodos(todos), nextTodo];
  }

  function updateTodo(todos, id, updates = {}) {
    return normalizeTodos(todos).map(todo => {
      if (todo.id !== String(id)) return todo;
      return {
        ...todo,
        ...updates,
      };
    });
  }

  function completeTodo(todos, id) {
    return updateTodo(todos, id, {
      completed: true,
      completedAt: new Date().toISOString(),
    });
  }

  function deleteTodo(todos, id) {
    return normalizeTodos(todos).map(todo => {
      if (todo.id !== String(id)) return todo;
      return {
        ...todo,
        dismissed: true,
        updatedAt: new Date().toISOString(),
      };
    });
  }

  function clearArchivedTodos(todos) {
    return normalizeTodos(todos).map(todo => {
      if (!todo.completed || todo.dismissed) return todo;
      return {
        ...todo,
        dismissed: true,
        updatedAt: new Date().toISOString(),
      };
    });
  }

  function splitTodos(todos) {
    const visible = normalizeTodos(todos).filter(todo => !todo.dismissed && !todo.deletedAt);
    return {
      active: visible.filter(todo => !todo.completed),
      archived: visible.filter(todo => todo.completed),
    };
  }

  function searchTodos(todos, query) {
    const needle = String(query || '').trim().toLowerCase();
    if (!needle) return normalizeTodos(todos);

    return normalizeTodos(todos).filter(todo =>
      todo.title.toLowerCase().includes(needle) ||
      todo.description.toLowerCase().includes(needle)
    );
  }

  const api = {
    completeTodo,
    clearArchivedTodos,
    createTodo,
    deleteTodo,
    normalizeTodos,
    searchTodos,
    splitTodos,
    updateTodo,
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }

  globalScope.TabOutTodosStore = api;
})(typeof globalThis !== 'undefined' ? globalThis : window);
