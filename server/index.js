const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');

// 确保从正确的路径加载 .env 文件
require('dotenv').config({ path: path.join(__dirname, '.env') });

const { initializeDatabase } = require('./config/initDatabase');

const app = express();

// 调试环境变量
console.log('环境变量调试:');
console.log('process.env.PORT:', process.env.PORT);
console.log('process.env.NODE_ENV:', process.env.NODE_ENV);

const PORT = process.env.PORT || 3200;

// Middleware
app.use(helmet());
app.use(cors({
  origin: [
    'http://localhost:3100',
    'http://127.0.0.1:3100',
    'http://192.168.0.197:3100',
    process.env.CORS_ORIGIN
  ].filter(Boolean),
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Wallet API Server is running',
    timestamp: new Date().toISOString()
  });
});

// Database status endpoint
app.get('/api/status', async (req, res) => {
  try {
    const { getDatabaseStats } = require('./config/initDatabase');
    const stats = await getDatabaseStats();
    res.json({ 
      status: 'OK', 
      database: 'SQLite',
      stats,
      timestamp: new Date().toISOString() 
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'ERROR', 
      error: error.message,
      timestamp: new Date().toISOString() 
    });
  }
});

// API routes will be added here
app.use('/api/wallets', require('./routes/wallets'));
app.use('/api/transfers', require('./routes/transfers'));
app.use('/api/transactions', require('./routes/transactions'));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Initialize database and start server
async function startServer() {
  try {
    console.log('正在初始化数据库...');
    const dbInitialized = await initializeDatabase();
    
    if (!dbInitialized) {
      console.error('数据库初始化失败，服务器启动中止');
      process.exit(1);
    }
    
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`服务器运行在端口 ${PORT}`);
      console.log(`环境: ${process.env.NODE_ENV || 'development'}`);
      console.log(`本地访问: http://localhost:${PORT}/api/health`);
      console.log(`局域网访问: http://0.0.0.0:${PORT}/api/health`);
      console.log(`数据库状态: http://localhost:${PORT}/api/status`);
    });
  } catch (error) {
    console.error('服务器启动失败:', error.message);
    process.exit(1);
  }
}

startServer();