const fs = require('fs');
const path = require('path');
const { db, dbAsync } = require('./database');

/**
 * 数据库初始化模块
 * 负责创建表结构、索引和触发器
 */

// 确保数据目录存在
const ensureDataDirectory = () => {
  const dataDir = path.join(__dirname, '..', 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
    console.log('创建数据目录:', dataDir);
  }
};

// 读取SQL初始化脚本
const readInitScript = () => {
  const sqlPath = path.join(__dirname, '..', '..', 'database', 'sqlite_init.sql');
  try {
    return fs.readFileSync(sqlPath, 'utf8');
  } catch (error) {
    console.error('读取初始化脚本失败:', error.message);
    return null;
  }
};

// 执行SQL脚本
const executeSqlScript = async (sqlScript) => {
  // 移除注释和空行
  const cleanScript = sqlScript
    .split('\n')
    .filter(line => {
      const trimmed = line.trim();
      return trimmed && !trimmed.startsWith('--');
    })
    .join('\n');

  // 使用更智能的方式分割SQL语句
  const statements = [];
  let currentStatement = '';
  let inTrigger = false;
  let braceCount = 0;

  for (const line of cleanScript.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    currentStatement += line + '\n';

    // 检查是否进入触发器
    if (trimmed.toUpperCase().includes('CREATE TRIGGER')) {
      inTrigger = true;
    }

    // 在触发器中计算大括号
    if (inTrigger) {
      for (const char of trimmed) {
        if (char === '{') braceCount++;
        if (char === '}') braceCount--;
      }
      
      // 检查是否是BEGIN/END块
      if (trimmed.toUpperCase() === 'BEGIN') {
        braceCount++;
      } else if (trimmed.toUpperCase() === 'END;') {
        braceCount--;
      }
    }

    // 检查是否是语句结束
    if (trimmed.endsWith(';')) {
      if (!inTrigger || (inTrigger && braceCount <= 0)) {
        statements.push(currentStatement.trim());
        currentStatement = '';
        inTrigger = false;
        braceCount = 0;
      }
    }
  }

  // 如果还有未完成的语句
  if (currentStatement.trim()) {
    statements.push(currentStatement.trim());
  }

  // 执行每个语句
  for (const statement of statements) {
    if (statement.trim()) {
      try {
        await dbAsync.run(statement);
        const preview = statement.replace(/\s+/g, ' ').substring(0, 50);
        console.log('执行SQL语句成功:', preview + '...');
      } catch (error) {
        const preview = statement.replace(/\s+/g, ' ').substring(0, 50);
        console.error('执行SQL语句失败:', preview + '...', error.message);
        console.error('完整语句:', statement);
        throw error;
      }
    }
  }
};

// 验证表结构
const verifyTables = async () => {
  try {
    // 检查wallets表
    const walletsInfo = await dbAsync.get("SELECT name FROM sqlite_master WHERE type='table' AND name='wallets'");
    if (!walletsInfo) {
      throw new Error('wallets表不存在');
    }

    // 检查transactions表
    const transactionsInfo = await dbAsync.get("SELECT name FROM sqlite_master WHERE type='table' AND name='transactions'");
    if (!transactionsInfo) {
      throw new Error('transactions表不存在');
    }

    // 检查索引
    const indexes = await dbAsync.all("SELECT name FROM sqlite_master WHERE type='index' AND name LIKE 'idx_%'");
    console.log('已创建的索引:', indexes.map(idx => idx.name));

    console.log('数据库表结构验证成功');
    return true;
  } catch (error) {
    console.error('数据库表结构验证失败:', error.message);
    return false;
  }
};

// 获取数据库统计信息
const getDatabaseStats = async () => {
  try {
    const walletCount = await dbAsync.get('SELECT COUNT(*) as count FROM wallets');
    const transactionCount = await dbAsync.get('SELECT COUNT(*) as count FROM transactions');
    
    return {
      wallets: walletCount.count,
      transactions: transactionCount.count
    };
  } catch (error) {
    console.error('获取数据库统计信息失败:', error.message);
    return null;
  }
};

// 主初始化函数
const initializeDatabase = async () => {
  try {
    console.log('开始初始化数据库...');
    
    // 1. 确保数据目录存在
    ensureDataDirectory();
    
    // 2. 读取初始化脚本
    const sqlScript = readInitScript();
    if (!sqlScript) {
      throw new Error('无法读取初始化脚本');
    }
    
    // 3. 执行初始化脚本
    await executeSqlScript(sqlScript);
    
    // 4. 验证表结构
    const isValid = await verifyTables();
    if (!isValid) {
      throw new Error('数据库表结构验证失败');
    }
    
    // 5. 显示统计信息
    const stats = await getDatabaseStats();
    if (stats) {
      console.log('数据库统计信息:', stats);
    }
    
    console.log('数据库初始化完成');
    return true;
  } catch (error) {
    console.error('数据库初始化失败:', error.message);
    return false;
  }
};

// 重置数据库（删除所有数据）
const resetDatabase = async () => {
  try {
    console.log('开始重置数据库...');
    
    await dbAsync.run('DELETE FROM transactions');
    await dbAsync.run('DELETE FROM wallets');
    
    console.log('数据库重置完成');
    return true;
  } catch (error) {
    console.error('数据库重置失败:', error.message);
    return false;
  }
};

module.exports = {
  initializeDatabase,
  resetDatabase,
  getDatabaseStats,
  verifyTables
};