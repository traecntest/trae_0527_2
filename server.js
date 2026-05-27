require('dotenv').config();

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const db = require('./config/database');

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
    res.json({ 
        status: 'ok', 
        message: '相变温度测定与可视化模块系统运行正常',
        mode: db.useInMemory() ? 'memory-demo' : 'mysql'
    });
});

if (require.main === module) {
    async function startServer() {
        console.log('========================================');
        console.log('  相变温度测定与可视化模块系统');
        console.log('========================================\n');
        
        const result = await db.initDatabase();
        
        if (!result.success) {
            console.log('\n提示: 系统在内存模式下运行');
            console.log('      所有数据将在服务重启后丢失');
            console.log('      如需持久化，请配置MySQL数据库\n');
        }
        
        app.listen(PORT, () => {
            console.log(`服务器运行在 http://localhost:${PORT}`);
            console.log(`按 Ctrl+C 停止服务器\n`);
        });
    }
    
    startServer();
}

module.exports = app;
