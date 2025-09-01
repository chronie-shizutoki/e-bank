# 设计文档

## 概述

简单电子钱包应用是一个基于Web的单页应用程序，提供基本的数字钱包功能。该应用采用前端技术栈构建，使用浏览器本地存储进行数据持久化，支持多语言界面和响应式设计。应用专注于用户体验和基本功能实现，不包含复杂的后端服务或高级安全验证机制。

## 架构

### 整体架构
应用采用前后端分离架构，包含以下主要组件：

#### 前端层
- **前端框架**: 使用现代JavaScript框架（建议React或Vue.js）
- **状态管理**: 集中式状态管理存储用户数据和应用状态
- **HTTP客户端**: 使用Axios或Fetch API与后端通信
- **国际化**: 集成i18n库支持多语言切换
- **响应式设计**: 使用CSS框架确保跨设备兼容性

#### 后端层
- **Web框架**: 使用Node.js + Express或Python + FastAPI
- **数据库**: 使用PostgreSQL或MySQL关系型数据库
- **ORM/ODM**: 使用Prisma、TypeORM或SQLAlchemy进行数据库操作
- **API设计**: RESTful API设计，支持JSON数据交换
- **数据验证**: 后端数据验证和业务逻辑处理

#### 数据库层
- **用户表**: 存储钱包用户信息
- **交易表**: 存储所有交易记录
- **索引优化**: 为查询频繁的字段建立索引

### 数据流设计
```
用户操作 → 前端组件 → API请求 → 后端服务 → 数据库操作 → API响应 → 前端状态更新 → UI重新渲染
```

**设计决策理由**: 采用前后端分离架构确保数据安全性和一致性，数据库持久化提供可靠的数据存储，便于后续功能扩展和多用户支持。

## 组件和接口

### 核心组件结构

#### 1. 应用容器组件 (App)
- 管理全局状态和路由
- 处理语言切换逻辑
- 初始化钱包数据加载

#### 2. 钱包创建组件 (WalletSetup)
- 首次访问时显示的钱包创建界面
- 收集用户名和初始余额输入
- 验证输入并创建钱包账户

#### 3. 主钱包界面组件 (WalletDashboard)
- 显示当前余额和账户信息
- 提供转账和查看历史记录的入口
- 语言切换控件

#### 4. 转账组件 (TransferForm)
- 转账表单界面
- 输入验证和余额检查
- 转账执行和结果反馈

#### 5. 交易历史组件 (TransactionHistory)
- 显示交易记录列表
- 支持分页或无限滚动
- 交易详情展示

#### 6. 语言切换组件 (LanguageSelector)
- 语言选择下拉菜单
- 实时语言切换功能

### API接口设计

#### 钱包相关API
```javascript
// 创建钱包
POST /api/wallets
Body: { username: string, initialBalance: number }
Response: { wallet: Wallet, success: boolean }

// 获取钱包信息
GET /api/wallets/:walletId
Response: { wallet: Wallet }

// 更新钱包余额
PUT /api/wallets/:walletId/balance
Body: { amount: number }
Response: { wallet: Wallet, success: boolean }
```

#### 转账相关API
```javascript
// 执行转账
POST /api/transfers
Body: { fromWalletId: string, toWalletId: string, amount: number }
Response: { transaction: Transaction, success: boolean }

// 获取交易历史
GET /api/wallets/:walletId/transactions?page=1&limit=20
Response: { transactions: Transaction[], total: number, page: number }
```

#### 前端服务接口 (WalletService)
```javascript
interface WalletService {
  createWallet(username: string, initialBalance: number): Promise<Wallet>
  getWallet(walletId: string): Promise<Wallet>
  transfer(fromWalletId: string, toWalletId: string, amount: number): Promise<TransactionResult>
  getTransactionHistory(walletId: string, page: number): Promise<TransactionPage>
}
```

#### 后端数据访问层 (Repository)
```javascript
interface WalletRepository {
  create(wallet: Wallet): Promise<Wallet>
  findById(id: string): Promise<Wallet | null>
  update(id: string, updates: Partial<Wallet>): Promise<Wallet>
  findByUsername(username: string): Promise<Wallet | null>
}

interface TransactionRepository {
  create(transaction: Transaction): Promise<Transaction>
  findByWalletId(walletId: string, page: number, limit: number): Promise<Transaction[]>
  countByWalletId(walletId: string): Promise<number>
}
```

**设计决策理由**: RESTful API设计便于前端调用和后续扩展，Repository模式抽象数据访问层便于测试和维护。

## 数据模型

### 数据库表设计

#### 钱包表 (wallets)
```sql
CREATE TABLE wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(50) UNIQUE NOT NULL,
  balance DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_wallets_username ON wallets(username);
```

#### 交易表 (transactions)
```sql
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_wallet_id UUID REFERENCES wallets(id),
  to_wallet_id UUID REFERENCES wallets(id),
  amount DECIMAL(15,2) NOT NULL,
  transaction_type VARCHAR(20) NOT NULL, -- 'transfer', 'initial_deposit'
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_transactions_from_wallet ON transactions(from_wallet_id);
CREATE INDEX idx_transactions_to_wallet ON transactions(to_wallet_id);
CREATE INDEX idx_transactions_created_at ON transactions(created_at);
```

### 应用数据模型

#### 钱包模型 (Wallet)
```javascript
interface Wallet {
  id: string
  username: string
  balance: number
  createdAt: Date
  updatedAt: Date
}
```

#### 交易模型 (Transaction)
```javascript
interface Transaction {
  id: string
  fromWalletId: string | null  // null for initial deposits
  toWalletId: string | null    // null for withdrawals
  amount: number
  transactionType: 'transfer' | 'initial_deposit'
  description: string
  createdAt: Date
}
```

#### 前端应用状态模型 (AppState)
```javascript
interface AppState {
  currentWallet: Wallet | null
  transactions: Transaction[]
  currentLanguage: string
  isLoading: boolean
  error: string | null
  pagination: {
    currentPage: number
    totalPages: number
    totalTransactions: number
  }
}
```

**设计决策理由**: 关系型数据库确保数据一致性和ACID特性，UUID主键避免ID冲突，索引优化查询性能，分离的交易表便于审计和历史查询。

## 错误处理

### 错误类型定义
- **ValidationError**: 输入验证失败
- **InsufficientFundsError**: 余额不足
- **StorageError**: 本地存储操作失败
- **NetworkError**: 未来扩展网络功能时使用

### 错误处理策略
1. **用户输入错误**: 前端实时验证并显示友好的错误提示
2. **业务逻辑错误**: 后端验证并返回具体错误信息
3. **网络错误**: 自动重试机制和离线状态提示
4. **数据库错误**: 事务回滚和错误日志记录
5. **系统错误**: 全局错误处理和用户友好的错误页面

### 错误显示机制
- 使用Toast通知显示临时错误信息
- 表单字段显示验证错误
- 全局错误边界捕获未处理异常

**设计决策理由**: 分层错误处理确保用户体验，同时便于调试和维护。

## 测试策略

### 单元测试
- **组件测试**: 使用Jest和React Testing Library测试组件行为
- **服务测试**: 测试钱包服务和存储服务的核心逻辑
- **工具函数测试**: 测试数据验证和格式化函数

### 集成测试
- **API集成测试**: 测试前后端API接口的正确性
- **数据库集成测试**: 测试数据库操作和事务处理
- **用户流程测试**: 测试完整的用户操作流程
- **多语言集成**: 测试语言切换功能

### 端到端测试
- **关键用户场景**: 钱包创建、转账、查看历史
- **响应式测试**: 不同设备尺寸下的功能测试
- **浏览器兼容性**: 主流浏览器的功能验证

### 测试数据管理
- 使用测试数据库进行集成测试
- 数据库迁移和种子数据管理
- 测试环境数据隔离和自动清理
- Mock API服务用于前端单元测试

**设计决策理由**: 全面的测试策略确保应用质量，分层测试便于快速定位问题。

## 国际化设计

### 支持语言
- 中文简体 (zh-CN)
- 中文繁体 (zh-TW)  
- 日语 (ja-JP)
- 英语 (en-US)

### 国际化实现
- 使用i18n库管理翻译资源
- 支持动态语言切换
- 本地存储用户语言偏好
- 数字和货币格式本地化

### 翻译资源结构
```javascript
{
  "wallet": {
    "balance": "余额",
    "transfer": "转账",
    "history": "交易历史"
  },
  "messages": {
    "insufficient_funds": "余额不足",
    "transfer_success": "转账成功"
  }
}
```

**设计决策理由**: 结构化的国际化设计便于维护和扩展新语言。

## 响应式设计

### 断点设计
- **移动端**: < 768px
- **平板端**: 768px - 1024px  
- **桌面端**: > 1024px

### 布局适配策略
- 移动端优先的设计方法
- 弹性布局和网格系统
- 触摸友好的交互元素
- 适配不同屏幕密度

### 组件响应式行为
- 导航菜单在移动端折叠
- 表单布局垂直堆叠
- 交易历史表格转换为卡片布局

**设计决策理由**: 移动端优先确保在所有设备上的良好体验，渐进增强提升大屏幕体验。
