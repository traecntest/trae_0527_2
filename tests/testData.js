const { calculatePhaseTransition } = require('../utils/phaseTransitionCalculator');

const testDatasets = {
    steelHeating: {
        name: '钢样加热实验',
        material: '45号钢',
        experiment_type: 'heating',
        dataPoints: [
            { time_value: 0, temperature: 25 },
            { time_value: 30, temperature: 150 },
            { time_value: 60, temperature: 280 },
            { time_value: 90, temperature: 410 },
            { time_value: 120, temperature: 540 },
            { time_value: 150, temperature: 650 },
            { time_value: 180, temperature: 700 },
            { time_value: 210, temperature: 720 },
            { time_value: 240, temperature: 730 },
            { time_value: 270, temperature: 735 },
            { time_value: 300, temperature: 740 },
            { time_value: 330, temperature: 760 },
            { time_value: 360, temperature: 800 },
            { time_value: 390, temperature: 850 },
            { time_value: 420, temperature: 900 },
            { time_value: 450, temperature: 950 },
            { time_value: 480, temperature: 1000 }
        ]
    },
    
    aluminumCooling: {
        name: '铝合金冷却实验',
        material: '6061铝合金',
        experiment_type: 'cooling',
        dataPoints: [
            { time_value: 0, temperature: 550 },
            { time_value: 30, temperature: 510 },
            { time_value: 60, temperature: 470 },
            { time_value: 90, temperature: 430 },
            { time_value: 120, temperature: 390 },
            { time_value: 150, temperature: 350 },
            { time_value: 180, temperature: 310 },
            { time_value: 210, temperature: 280 },
            { time_value: 240, temperature: 260 },
            { time_value: 270, temperature: 250 },
            { time_value: 300, temperature: 245 },
            { time_value: 330, temperature: 240 },
            { time_value: 360, temperature: 220 },
            { time_value: 390, temperature: 190 },
            { time_value: 420, temperature: 150 },
            { time_value: 450, temperature: 100 },
            { time_value: 480, temperature: 50 },
            { time_value: 510, temperature: 25 }
        ]
    },
    
    copperHeating: {
        name: '铜合金加热实验',
        material: '黄铜',
        experiment_type: 'heating',
        dataPoints: [
            { time_value: 0, temperature: 20 },
            { time_value: 50, temperature: 120 },
            { time_value: 100, temperature: 220 },
            { time_value: 150, temperature: 320 },
            { time_value: 200, temperature: 420 },
            { time_value: 250, temperature: 520 },
            { time_value: 300, temperature: 600 },
            { time_value: 350, temperature: 680 },
            { time_value: 400, temperature: 740 },
            { time_value: 450, temperature: 780 },
            { time_value: 500, temperature: 810 },
            { time_value: 550, temperature: 850 },
            { time_value: 600, temperature: 900 },
            { time_value: 650, temperature: 950 },
            { time_value: 700, temperature: 1000 }
        ]
    },
    
    ironCooling: {
        name: '铸铁冷却实验',
        material: '灰铸铁',
        experiment_type: 'cooling',
        dataPoints: [
            { time_value: 0, temperature: 1200 },
            { time_value: 20, temperature: 1150 },
            { time_value: 40, temperature: 1100 },
            { time_value: 60, temperature: 1050 },
            { time_value: 80, temperature: 1000 },
            { time_value: 100, temperature: 950 },
            { time_value: 120, temperature: 900 },
            { time_value: 140, temperature: 850 },
            { time_value: 160, temperature: 800 },
            { time_value: 180, temperature: 760 },
            { time_value: 200, temperature: 730 },
            { time_value: 220, temperature: 710 },
            { time_value: 240, temperature: 690 },
            { time_value: 260, temperature: 650 },
            { time_value: 280, temperature: 600 },
            { time_value: 300, temperature: 550 },
            { time_value: 320, temperature: 500 },
            { time_value: 340, temperature: 450 },
            { time_value: 360, temperature: 400 },
            { time_value: 380, temperature: 350 },
            { time_value: 400, temperature: 300 }
        ]
    }
};

function runAllTests() {
    console.log('========================================');
    console.log('  相变温度测定 - 测试数据集验证');
    console.log('========================================\n');
    
    let passed = 0;
    let failed = 0;
    
    Object.entries(testDatasets).forEach(([key, dataset]) => {
        console.log(`测试: ${dataset.name}`);
        console.log(`材料: ${dataset.material}`);
        console.log(`类型: ${dataset.experiment_type === 'heating' ? '升温' : '降温'}`);
        console.log(`数据点数: ${dataset.dataPoints.length}`);
        
        const result = calculatePhaseTransition(dataset.dataPoints);
        
        if (result.success) {
            console.log(`✓ 计算成功`);
            console.log(`  相变温度: ${result.phaseTransition.temperature} ℃`);
            console.log(`  对应时间: ${result.phaseTransition.time} 秒`);
            console.log(`  数据点数量: ${result.details.dataPointsCount}`);
            console.log(`  最大斜率变化: ${result.details.maxSlopeChange}`);
            passed++;
        } else {
            console.log(`✗ 计算失败: ${result.error}`);
            failed++;
        }
        
        console.log('-'.repeat(40));
    });
    
    console.log(`\n测试结果: ${passed} 通过, ${failed} 失败`);
    console.log('========================================\n');
    
    return { passed, failed };
}

if (require.main === module) {
    const results = runAllTests();
    process.exit(results.failed > 0 ? 1 : 0);
}

module.exports = { testDatasets, runAllTests };
