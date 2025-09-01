/**
 * 本地存储管理器
 * 提供对浏览器localStorage的封装，支持数据的增删改查操作
 */

import { STORAGE_KEYS, AppSettingsSchema } from './schema.js';

class StorageManager {
  constructor() {
    this.isAvailable = this.checkStorageAvailability();
  }

  // 检查localStorage是否可用
  checkStorageAvailability() {
    try {
      const test = '__storage_test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch (e) {
      console.warn('localStorage不可用，数据将不会持久化');
      return false;
    }
  }

  // 获取数据
  get(key) {
    if (!this.isAvailable) return null;
    
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error(`读取存储数据失败: ${key}`, error);
      return null;
    }
  }

  // 设置数据
  set(key, value) {
    if (!this.isAvailable) return false;
    
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error(`保存存储数据失败: ${key}`, error);
      return false;
    }
  }

  // 删除数据
  remove(key) {
    if (!this.isAvailable) return false;
    
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error(`删除存储数据失败: ${key}`, error);
      return false;
    }
  }

  // 清空所有应用数据
  clear() {
    if (!this.isAvailable) return false;
    
    try {
      Object.values(STORAGE_KEYS).forEach(key => {
        localStorage.removeItem(key);
      });
      return true;
    } catch (error) {
      console.error('清空存储数据失败', error);
      return false;
    }
  }

  // 获取所有钱包
  getWallets() {
    return this.get(STORAGE_KEYS.WALLETS) || [];
  }

  // 保存钱包列表
  setWallets(wallets) {
    return this.set(STORAGE_KEYS.WALLETS, wallets);
  }

  // 获取所有交易
  getTransactions() {
    return this.get(STORAGE_KEYS.TRANSACTIONS) || [];
  }

  // 保存交易列表
  setTransactions(transactions) {
    return this.set(STORAGE_KEYS.TRANSACTIONS, transactions);
  }

  // 获取当前钱包ID
  getCurrentWalletId() {
    return this.get(STORAGE_KEYS.CURRENT_WALLET);
  }

  // 设置当前钱包ID
  setCurrentWalletId(walletId) {
    return this.set(STORAGE_KEYS.CURRENT_WALLET, walletId);
  }

  // 获取应用设置
  getAppSettings() {
    const settings = this.get(STORAGE_KEYS.APP_SETTINGS);
    return settings ? { ...AppSettingsSchema, ...settings } : AppSettingsSchema;
  }

  // 保存应用设置
  setAppSettings(settings) {
    const currentSettings = this.getAppSettings();
    const newSettings = { ...currentSettings, ...settings };
    return this.set(STORAGE_KEYS.APP_SETTINGS, newSettings);
  }

  // 数据迁移和初始化
  initializeStorage() {
    // 检查是否需要初始化
    const wallets = this.getWallets();
    const transactions = this.getTransactions();
    const settings = this.getAppSettings();

    // 如果没有数据，创建空的数据结构
    if (wallets.length === 0) {
      this.setWallets([]);
    }
    
    if (transactions.length === 0) {
      this.setTransactions([]);
    }

    // 确保设置存在
    this.setAppSettings(settings);

    console.log('本地存储初始化完成');
    return true;
  }

  // 导出数据（用于备份）
  exportData() {
    return {
      wallets: this.getWallets(),
      transactions: this.getTransactions(),
      settings: this.getAppSettings(),
      exportDate: new Date().toISOString()
    };
  }

  // 导入数据（用于恢复）
  importData(data) {
    try {
      if (data.wallets) this.setWallets(data.wallets);
      if (data.transactions) this.setTransactions(data.transactions);
      if (data.settings) this.setAppSettings(data.settings);
      return true;
    } catch (error) {
      console.error('导入数据失败', error);
      return false;
    }
  }

  // 获取存储使用情况
  getStorageInfo() {
    if (!this.isAvailable) return null;

    const data = this.exportData();
    const dataSize = JSON.stringify(data).length;
    
    return {
      isAvailable: this.isAvailable,
      dataSize: dataSize,
      walletCount: data.wallets.length,
      transactionCount: data.transactions.length
    };
  }
}

// 创建单例实例
export const storageManager = new StorageManager();
export default storageManager;