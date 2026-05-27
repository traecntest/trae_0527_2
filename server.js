require('dotenv').config();

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const { testConnection } = require('./config/database');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, 'public')));

const experimentRoutes = require('./routes/experiments');
app.use('/api/experiments', experimentRoutes);

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: '相变温度测定与可视化模块系统运行正常' });
});

if (require.main === module) {
    async function startServer() {
        const connected = await testConnection(3, 2000);
        if (!connected) {
            console.warn('警告：无法连接到数据库，部分功能可能不可用');
        }
        
        app.listen(PORT, () => {
            console.log(`服务器运行在 http://localhost:${PORT}`);
        });
    }
    
    startServer();
}

module.exports = app;
