const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// 确保从正确的路径加载 .env 文件
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

// 数据库文件路径
const dbPath = path.join(__dirname, '..', 'data', 'wallet.db');

// 创建数据库连接
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('SQLite连接错误:', err.message);
  } else {
    console.log('已连接到SQLite数据库');
    // 启用外键约束
    db.run('PRAGMA foreign_keys = ON');
  }
});

// 数据库操作的Promise包装器
const dbAsync = {
  // 执行查询并返回所有结果
  all: (sql, params = []) => {
    return new Promise((resolve, reject) => {
      db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  },

  // 执行查询并返回第一个结果
  get: (sql, params = []) => {
    return new Promise((resolve, reject) => {
      db.get(sql, params, (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  },

  // 执行插入/更新/删除操作
  run: (sql, params = []) => {
    return new Promise((resolve, reject) => {
      db.run(sql, params, function(err) {
        if (err) reject(err);
        else resolve({ lastID: this.lastID, changes: this.changes });
      });
    });
  },

  // 开始事务
  beginTransaction: () => {
    return dbAsync.run('BEGIN TRANSACTION');
  },

  // 提交事务
  commit: () => {
    return dbAsync.run('COMMIT');
  },

  // 回滚事务
  rollback: () => {
    return dbAsync.run('ROLLBACK');
  }
};

// 优雅关闭数据库连接
process.on('SIGINT', () => {
  db.close((err) => {
    if (err) {
      console.error('关闭数据库连接时出错:', err.message);
    } else {
      console.log('数据库连接已关闭');
    }
    process.exit(0);
  });
});

module.exports = { db, dbAsync };