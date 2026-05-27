const API_BASE = '/api/experiments';

let currentExperimentId = null;
let dataPoints = [];
let phaseTransitionResult = null;
let phaseTransitions = [];

document.addEventListener('DOMContentLoaded', function() {
    initEventListeners();
    loadExperiments();
    addDataRow();
    addDataRow();
    addDataRow();
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
});

function initEventListeners() {
    document.getElementById('newExperimentBtn').addEventListener('click', resetForm);
    document.getElementById('deleteExperimentBtn').addEventListener('click', deleteExperiment);
    document.getElementById('experimentSelect').addEventListener('change', selectExperiment);
    document.getElementById('addRowBtn').addEventListener('click', addDataRow);
    document.getElementById('saveDataBtn').addEventListener('click', saveExperimentAndData);
    document.getElementById('calculateBtn').addEventListener('click', calculatePhaseTransition);
    document.getElementById('experimentForm').addEventListener('submit', function(e) {
        e.preventDefault();
    });
}

function resizeCanvas() {
    const canvas = document.getElementById('chartCanvas');
    const container = canvas.parentElement;
    canvas.width = container.clientWidth - 40;
    canvas.height = Math.max(500, container.clientHeight - 80);
    drawChart();
}

async function loadExperiments() {
    try {
        const response = await fetch(API_BASE);
        const result = await response.json();
        
        if (result.success) {
            const select = document.getElementById('experimentSelect');
            select.innerHTML = '<option value="">-- 选择实验 --</option>';
            
            result.data.forEach(exp => {
                const option = document.createElement('option');
                option.value = exp.id;
                option.textContent = `${exp.name} (${exp.material})`;
                select.appendChild(option);
            });
        }
    } catch (error) {
        console.error('加载实验列表失败:', error);
    }
}

async function selectExperiment(e) {
    const experimentId = e.target.value;
    
    if (!experimentId) {
        resetForm();
        return;
    }
    
    currentExperimentId = parseInt(experimentId);
    
    try {
        const [expResponse, dataResponse] = await Promise.all([
            fetch(`${API_BASE}/${experimentId}`),
            fetch(`${API_BASE}/${experimentId}/data-points`)
        ]);
        
        const expResult = await expResponse.json();
        const dataResult = await dataResponse.json();
        
        if (expResult.success) {
            const exp = expResult.data;
            document.getElementById('experimentName').value = exp.name;
            document.getElementById('material').value = exp.material;
            document.getElementById('experimentType').value = exp.experiment_type;
            document.getElementById('description').value = exp.description || '';
        }
        
        if (dataResult.success) {
            dataPoints = dataResult.data;
            renderDataTable();
            drawChart();
        }
        
        document.getElementById('resultSection').style.display = 'none';
        phaseTransitionResult = null;
        phaseTransitions = [];
        
    } catch (error) {
        console.error('加载实验数据失败:', error);
        alert('加载实验数据失败');
    }
}

function resetForm() {
    document.getElementById('experimentForm').reset();
    document.getElementById('experimentSelect').value = '';
    currentExperimentId = null;
    dataPoints = [];
    phaseTransitionResult = null;
    phaseTransitions = [];
    document.getElementById('resultSection').style.display = 'none';
    renderDataTable();
    drawChart();
}

function renderDataTable() {
    const tbody = document.getElementById('dataPointsBody');
    tbody.innerHTML = '';
    
    if (dataPoints.length === 0) {
        for (let i = 0; i < 3; i++) {
            addDataRow();
        }
        return;
    }
    
    dataPoints.forEach((point, index) => {
        addDataRow(point, index);
    });
}

function addDataRow(point = null, index = null) {
    const tbody = document.getElementById('dataPointsBody');
    const row = document.createElement('tr');
    
    const rowIndex = index !== null ? index + 1 : tbody.children.length + 1;
    
    row.innerHTML = `
        <td>${rowIndex}</td>
        <td><input type="number" step="0.1" class="time-input" value="${point ? point.time_value : ''}" placeholder="时间"></td>
        <td><input type="number" step="0.1" class="temp-input" value="${point ? point.temperature : ''}" placeholder="温度"></td>
        <td><button type="button" class="btn btn-delete" onclick="deleteRow(this)">删除</button></td>
    `;
    
    tbody.appendChild(row);
}

function deleteRow(btn) {
    const row = btn.closest('tr');
    row.remove();
    updateRowNumbers();
    collectDataPoints();
    drawChart();
}

function updateRowNumbers() {
    const rows = document.querySelectorAll('#dataPointsBody tr');
    rows.forEach((row, index) => {
        row.querySelector('td:first-child').textContent = index + 1;
    });
}

function collectDataPoints() {
    const rows = document.querySelectorAll('#dataPointsBody tr');
    dataPoints = [];
    
    rows.forEach(row => {
        const time = parseFloat(row.querySelector('.time-input').value);
        const temp = parseFloat(row.querySelector('.temp-input').value);
        
        if (!isNaN(time) && !isNaN(temp)) {
            dataPoints.push({ time_value: time, temperature: temp });
        }
    });
    
    dataPoints.sort((a, b) => a.time_value - b.time_value);
    return dataPoints;
}

async function saveExperimentAndData() {
    const form = document.getElementById('experimentForm');
    const formData = new FormData(form);
    
    const experimentData = {
        name: formData.get('name'),
        material: formData.get('material'),
        experiment_type: formData.get('experiment_type'),
        description: formData.get('description')
    };
    
    if (!experimentData.name || !experimentData.material) {
        alert('请填写实验名称和材料名称');
        return;
    }
    
    collectDataPoints();
    
    if (dataPoints.length < 5) {
        alert('至少需要5个有效数据点');
        return;
    }
    
    try {
        let experimentId = currentExperimentId;
        
        if (!experimentId) {
            const createResponse = await fetch(API_BASE, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(experimentData)
            });
            
            const createResult = await createResponse.json();
            
            if (!createResult.success) {
                throw new Error(createResult.error);
            }
            
            experimentId = createResult.data.id;
            currentExperimentId = experimentId;
            await loadExperiments();
            document.getElementById('experimentSelect').value = experimentId;
        } else {
            const updateResponse = await fetch(`${API_BASE}/${experimentId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(experimentData)
            });
        }
        
        await fetch(`${API_BASE}/data-points/batch`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                experiment_id: experimentId,
                data_points: dataPoints
            })
        });
        
        alert('保存成功！');
        drawChart();
        
    } catch (error) {
        console.error('保存失败:', error);
        alert('保存失败: ' + error.message);
    }
}

async function deleteExperiment() {
    if (!currentExperimentId) {
        alert('请先选择要删除的实验');
        return;
    }
    
    if (!confirm('确定要删除该实验吗？')) {
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/${currentExperimentId}`, {
            method: 'DELETE'
        });
        
        const result = await response.json();
        
        if (result.success) {
            alert('删除成功！');
            resetForm();
            await loadExperiments();
        } else {
            alert('删除失败: ' + result.error);
        }
    } catch (error) {
        console.error('删除失败:', error);
        alert('删除失败');
    }
}

async function calculatePhaseTransition() {
    collectDataPoints();
    
    if (dataPoints.length < 5) {
        alert('至少需要5个有效数据点才能计算');
        return;
    }
    
    if (!currentExperimentId) {
        alert('请先保存实验数据');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/${currentExperimentId}/calculate`);
        const result = await response.json();
        
        if (result.success) {
            phaseTransitionResult = result.phaseTransition;
            phaseTransitions = result.phaseTransitions || [result.phaseTransition];
            
            displayResults(result);
            drawChart();
        } else {
            alert('计算失败: ' + result.error);
        }
    } catch (error) {
        console.error('计算失败:', error);
        alert('计算失败');
    }
}

function displayResults(result) {
    const resultSection = document.getElementById('resultSection');
    const transitionsContainer = document.getElementById('phaseTransitionsList');
    
    transitionsContainer.innerHTML = '';
    
    phaseTransitions.forEach((transition, index) => {
        const colors = ['#dc3545', '#ff6b35', '#28a745', '#17a2b8', '#6f42c1'];
        const color = colors[index % colors.length];
        
        const item = document.createElement('div');
        item.className = 'phase-transition-item';
        item.innerHTML = `
            <div class="transition-marker" style="background-color: ${color}"></div>
            <div class="transition-info">
                <span class="transition-name">${transition.name || '相变点 ' + (index + 1)}</span>
                <span class="transition-temp">${transition.temperature} ℃</span>
                <span class="transition-time">时间: ${transition.time}s</span>
                <span class="transition-confidence">置信度: ${transition.confidence || 100}%</span>
            </div>
        `;
        transitionsContainer.appendChild(item);
    });
    
    resultSection.style.display = 'block';
}

function drawChart() {
    const canvas = document.getElementById('chartCanvas');
    const ctx = canvas.getContext('2d');
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    if (dataPoints.length === 0) {
        drawEmptyChart(ctx, canvas);
        return;
    }
    
    const padding = { top: 40, right: 100, bottom: 60, left: 80 };
    const chartWidth = canvas.width - padding.left - padding.right;
    const chartHeight = canvas.height - padding.top - padding.bottom;
    
    const times = dataPoints.map(p => p.time_value);
    const temps = dataPoints.map(p => p.temperature);
    
    const minTime = Math.min(...times);
    const maxTime = Math.max(...times);
    const minTemp = Math.min(...temps);
    const maxTemp = Math.max(...temps);
    
    const timeRange = maxTime - minTime || 1;
    const tempRange = maxTemp - minTemp || 1;
    
    drawAxes(ctx, padding, chartWidth, chartHeight, minTime, maxTime, minTemp, maxTemp);
    drawGrid(ctx, padding, chartWidth, chartHeight);
    drawCurve(ctx, padding, chartWidth, chartHeight, minTime, maxTime, minTemp, maxTemp);
    drawDataPoints(ctx, padding, chartWidth, chartHeight, minTime, maxTime, minTemp, maxTemp);
    
    if (phaseTransitions && phaseTransitions.length > 0) {
        drawPhaseTransitionLines(ctx, padding, chartWidth, chartHeight, minTemp, maxTemp, minTime, maxTime);
    }
    
    drawLabels(ctx, padding, chartWidth, chartHeight);
}

function drawEmptyChart(ctx, canvas) {
    ctx.fillStyle = '#999';
    ctx.font = '16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('请输入数据点以绘制温度-时间曲线', canvas.width / 2, canvas.height / 2);
}

function drawAxes(ctx, padding, width, height, minTime, maxTime, minTemp, maxTemp) {
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    
    ctx.beginPath();
    ctx.moveTo(padding.left, padding.top);
    ctx.lineTo(padding.left, padding.top + height);
    ctx.lineTo(padding.left + width, padding.top + height);
    ctx.stroke();
    
    ctx.fillStyle = '#666';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    
    const timeStep = (maxTime - minTime) / 5;
    for (let i = 0; i <= 5; i++) {
        const time = minTime + timeStep * i;
        const x = padding.left + (time - minTime) / (maxTime - minTime || 1) * width;
        ctx.fillText(time.toFixed(0) + 's', x, padding.top + height + 20);
    }
    
    ctx.textAlign = 'right';
    const tempStep = (maxTemp - minTemp) / 5;
    for (let i = 0; i <= 5; i++) {
        const temp = minTemp + tempStep * i;
        const y = padding.top + height - (temp - minTemp) / (maxTemp - minTemp || 1) * height;
        ctx.fillText(temp.toFixed(0) + '℃', padding.left - 10, y + 4);
    }
}

function drawGrid(ctx, padding, width, height) {
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);
    
    for (let i = 0; i <= 5; i++) {
        const x = padding.left + (width / 5) * i;
        ctx.beginPath();
        ctx.moveTo(x, padding.top);
        ctx.lineTo(x, padding.top + height);
        ctx.stroke();
        
        const y = padding.top + (height / 5) * i;
        ctx.beginPath();
        ctx.moveTo(padding.left, y);
        ctx.lineTo(padding.left + width, y);
        ctx.stroke();
    }
    
    ctx.setLineDash([]);
}

function drawCurve(ctx, padding, width, height, minTime, maxTime, minTemp, maxTemp) {
    if (dataPoints.length < 2) return;
    
    ctx.strokeStyle = '#667eea';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    
    dataPoints.forEach((point, index) => {
        const x = padding.left + (point.time_value - minTime) / (maxTime - minTime || 1) * width;
        const y = padding.top + height - (point.temperature - minTemp) / (maxTemp - minTemp || 1) * height;
        
        if (index === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
    });
    
    ctx.stroke();
}

function drawDataPoints(ctx, padding, width, height, minTime, maxTime, minTemp, maxTemp) {
    dataPoints.forEach(point => {
        const x = padding.left + (point.time_value - minTime) / (maxTime - minTime || 1) * width;
        const y = padding.top + height - (point.temperature - minTemp) / (maxTemp - minTemp || 1) * height;
        
        ctx.fillStyle = '#fff';
        ctx.strokeStyle = '#667eea';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(x, y, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
    });
}

function drawPhaseTransitionLines(ctx, padding, width, height, minTemp, maxTemp, minTime, maxTime) {
    const colors = ['#dc3545', '#ff6b35', '#28a745', '#17a2b8', '#6f42c1'];
    
    phaseTransitions.forEach((transition, index) => {
        const color = colors[index % colors.length];
        const temp = transition.temperature;
        const time = transition.time;
        
        const y = padding.top + height - (temp - minTemp) / (maxTemp - minTemp || 1) * height;
        const x = padding.left + (time - minTime) / (maxTime - minTime || 1) * width;
        
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.setLineDash([8, 4]);
        ctx.beginPath();
        ctx.moveTo(padding.left, y);
        ctx.lineTo(padding.left + width, y);
        ctx.stroke();
        ctx.setLineDash([]);
        
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(x, y, 8, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = color;
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'left';
        const labelY = y - (index * 20);
        ctx.fillText(`${transition.name || '相变点'}: ${temp.toFixed(1)}℃`, padding.left + width + 10, labelY + 5);
    });
}

function drawLabels(ctx, padding, width, height) {
    ctx.fillStyle = '#333';
    ctx.font = '14px Arial';
    ctx.textAlign = 'center';
    
    ctx.fillText('时间 (秒)', padding.left + width / 2, padding.top + height + 45);
    
    ctx.save();
    ctx.translate(20, padding.top + height / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('温度 (℃)', 0, 0);
    ctx.restore();
    
    ctx.font = 'bold 16px Arial';
    ctx.fillText('温度-时间曲线', padding.left + width / 2, padding.top - 15);
}
