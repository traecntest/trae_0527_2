# 相变温度测定与可视化模块系统

## 项目简介

本系统旨在通过采集材料在热处理过程中的温度与时间数据，自动计算相变临界点，并以图形化方式展示结果。系统采用Express + MySQL + 纯前端技术栈实现。

## 系统架构

- **后端框架**: Express.js
- **数据库**: MySQL
- **前端**: HTML5 + CSS3 + JavaScript (Canvas)
- **测试框架**: Jest

## 项目结构

```
phase-transition-temperature/
├── config/
│   └── database.js          # 数据库配置
├── controllers/
│   └── experimentController.js  # 实验控制器
├── database/
│   └── schema.sql           # 数据库建表脚本
├── public/
│   ├── css/
│   │   └── style.css        # 前端样式
│   ├── js/
│   │   └── app.js           # 前端逻辑
│   └── index.html           # 首页
├── routes/
│   └── experiments.js       # API路由
├── tests/
│   └── phaseTransitionCalculator.test.js  # 单元测试
├── utils/
│   └── phaseTransitionCalculator.js      # 相变温度计算算法
├── package.json
├── server.js                 # 服务器入口
└── README.md
```

## 快速开始

### 1. 环境要求

- Node.js >= 14.x
- MySQL >= 5.7

### 2. 安装依赖

```bash
npm install
```

### 3. 配置数据库

编辑 `config/database.js` 文件，配置MySQL连接信息：

```javascript
const pool = mysql.createPool({
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: 'your_password',
    database: 'phase_transition_db'
});
```

### 4. 初始化数据库

执行 `database/schema.sql` 脚本创建数据库和表，并插入测试数据：

```bash
mysql -u root -p < database/schema.sql
```

### 5. 启动服务

```bash
npm start
```

服务器将在 `http://localhost:3000` 启动。

### 6. 运行测试

```bash
npm test
```

## API 接口文档

### 实验管理

#### 创建实验
- **POST** `/api/experiments`
- 请求体：
```json
{
    "name": "实验名称",
    "material": "材料名称",
    "experiment_type": "heating",
    "description": "实验描述"
}
```

#### 获取实验列表
- **GET** `/api/experiments`

#### 获取单个实验
- **GET** `/api/experiments/:id`

#### 更新实验
- **PUT** `/api/experiments/:id`

#### 删除实验
- **DELETE** `/api/experiments/:id`

### 数据点管理

#### 批量插入数据点
- **POST** `/api/experiments/data-points/batch`
- 请求体：
```json
{
    "experiment_id": 1,
    "data_points": [
        { "time_value": 0, "temperature": 25 },
        { "time_value": 10, "temperature": 100 }
    ]
}
```

#### 获取实验数据点
- **GET** `/api/experiments/:experiment_id/data-points`

### 相变温度计算

#### 计算相变温度
- **GET** `/api/experiments/:experiment_id/calculate`
- 返回：
```json
{
    "success": true,
    "experiment_id": 1,
    "phaseTransition": {
        "temperature": 750.5,
        "time": 125.5,
        "x": 125.5,
        "y": 750.5
    },
    "details": {
        "dataPointsCount": 22,
        "maxSlopeChange": 2.5,
        "slopes": [...]
    }
}
```

## 算法说明

### 相变温度计算 - 简化切线法

系统采用简化的切线法（斜率突变检测）来识别相变温度：

1. **计算斜率**: 对相邻数据点计算温度变化率 (dT/dt)
2. **平滑处理**: 使用移动窗口平滑斜率数据以减少噪声
3. **检测突变**: 寻找斜率变化最大的位置作为相变点
4. **结果输出**: 返回相变温度和对应时间

## 功能特性

### 前端功能
- ✅ 实验列表管理（新建、选择、删除）
- ✅ 实验信息表单编辑
- ✅ 动态数据点表格（新增、删除行）
- ✅ Canvas绘制温度-时间曲线
- ✅ 相变温度计算结果展示
- ✅ 红色虚线标识相变温度

### 后端功能
- ✅ RESTful API 设计
- ✅ 实验CRUD操作
- ✅ 批量数据点插入
- ✅ 相变温度自动计算
- ✅ MySQL数据库存储

## 使用说明

1. **新建实验**: 点击"新建实验"按钮，填写实验信息
2. **输入数据**: 在数据点表格中输入时间和温度数据
3. **保存数据**: 点击"保存数据"按钮保存实验
4. **计算相变**: 点击"计算相变温度"按钮
5. **查看结果**: 右侧图表将显示曲线和相变点标识

## 测试数据

系统预置了两条测试曲线：

1. **钢样A升温实验** - 模拟碳钢相变过程
2. **铝合金冷却实验** - 模拟铝合金冷却相变过程

## License

ISC
