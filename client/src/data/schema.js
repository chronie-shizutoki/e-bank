/**
 * 本地存储数据结构定义
 * 定义钱包和交易的数据模型，用于浏览器本地存储
 */

// 存储键名常量
export const STORAGE_KEYS = {
  WALLETS: 'simple_wallet_wallets',
  TRANSACTIONS: 'simple_wallet_transactions',
  CURRENT_WALLET: 'simple_wallet_current',
  APP_SETTINGS: 'simple_wallet_settings'
};

// 钱包数据模型
export const WalletSchema = {
  id: '', // UUID字符串
  username: '', // 用户名，唯一标识
  balance: 0, // 余额，数字类型
  createdAt: '', // 创建时间，ISO字符串
  updatedAt: '' // 更新时间，ISO字符串
};

// 交易数据模型
export const TransactionSchema = {
  id: '', // UUID字符串
  fromWalletId: null, // 发送方钱包ID，null表示初始存款
  toWalletId: null, // 接收方钱包ID，null表示提取
  amount: 0, // 交易金额
  transactionType: '', // 交易类型：'transfer', 'initial_deposit'
  description: '', // 交易描述
  createdAt: '' // 创建时间，ISO字符串
};

// 应用设置模型
export const AppSettingsSchema = {
  language: 'zh-CN', // 当前语言
  theme: 'light', // 主题设置
  currency: 'CNY' // 货币类型
};

// 数据验证函数
export const validateWallet = (wallet) => {
  const errors = [];
  
  if (!wallet.id || typeof wallet.id !== 'string') {
    errors.push('钱包ID无效');
  }
  
  if (!wallet.username || typeof wallet.username !== 'string' || wallet.username.length < 1) {
    errors.push('用户名无效');
  }
  
  if (typeof wallet.balance !== 'number' || wallet.balance < 0) {
    errors.push('余额必须为非负数');
  }
  
  if (!wallet.createdAt || !wallet.updatedAt) {
    errors.push('时间戳无效');
  }
  
  return errors;
};

export const validateTransaction = (transaction) => {
  const errors = [];
  
  if (!transaction.id || typeof transaction.id !== 'string') {
    errors.push('交易ID无效');
  }
  
  if (typeof transaction.amount !== 'number' || transaction.amount <= 0) {
    errors.push('交易金额必须为正数');
  }
  
  if (!['transfer', 'initial_deposit'].includes(transaction.transactionType)) {
    errors.push('交易类型无效');
  }
  
  if (!transaction.createdAt) {
    errors.push('创建时间无效');
  }
  
  return errors;
};

// 生成UUID的简单实现
export const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

// 创建新钱包对象
export const createWallet = (username, initialBalance = 0) => {
  const now = new Date().toISOString();
  return {
    id: generateUUID(),
    username: username.trim(),
    balance: Number(initialBalance),
    createdAt: now,
    updatedAt: now
  };
};

// 创建新交易对象
export const createTransaction = (fromWalletId, toWalletId, amount, type = 'transfer', description = '') => {
  return {
    id: generateUUID(),
    fromWalletId,
    toWalletId,
    amount: Number(amount),
    transactionType: type,
    description: description.trim(),
    createdAt: new Date().toISOString()
  };
};