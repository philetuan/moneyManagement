window.MoneyFlowStorage = (() => {
  const KEYS = {
    TRANSACTIONS: "mf_transactions",
    CATEGORIES: "mf_categories"
  };

  function init() {
    if (!localStorage.getItem(KEYS.CATEGORIES)) {
      localStorage.setItem(KEYS.CATEGORIES, JSON.stringify(window.MoneyFlowData.defaultCategories));
    }
    if (!localStorage.getItem(KEYS.TRANSACTIONS)) {
      localStorage.setItem(KEYS.TRANSACTIONS, JSON.stringify([]));
    }
  }

  function getTransactions() {
    try {
      return JSON.parse(localStorage.getItem(KEYS.TRANSACTIONS)) || [];
    } catch (e) {
      return [];
    }
  }

  function saveTransactions(data) {
    localStorage.setItem(KEYS.TRANSACTIONS, JSON.stringify(data));
  }

  function getCategories() {
    try {
      return JSON.parse(localStorage.getItem(KEYS.CATEGORIES)) || window.MoneyFlowData.defaultCategories;
    } catch (e) {
      return window.MoneyFlowData.defaultCategories;
    }
  }

  function addCategory(type, categoryName) {
    const categories = getCategories();
    if (!categories[type]) categories[type] = [];
    
    if (!categories[type].includes(categoryName)) {
      categories[type].push(categoryName);
      localStorage.setItem(KEYS.CATEGORIES, JSON.stringify(categories));
    }
  }

  function deleteCategory(type, categoryName) {
    const categories = getCategories();
    if (categories[type]) {
      categories[type] = categories[type].filter(c => c !== categoryName);
      localStorage.setItem(KEYS.CATEGORIES, JSON.stringify(categories));
    }
  }

  function addTransaction(transaction) {
    const list = getTransactions();
    list.unshift(transaction);
    saveTransactions(list);
  }

  function updateTransaction(updatedItem) {
    const list = getTransactions().map(item => item.id === updatedItem.id ? updatedItem : item);
    saveTransactions(list);
  }

  function deleteTransaction(id) {
    const list = getTransactions().filter(item => item.id !== id);
    saveTransactions(list);
  }

  return {
    init,
    getTransactions,
    saveTransactions,
    getCategories,
    addCategory,
    deleteCategory,
    addTransaction,
    updateTransaction,
    deleteTransaction
  };
})();