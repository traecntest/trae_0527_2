function calculatePhaseTransition(dataPoints) {
    if (!dataPoints || dataPoints.length < 5) {
        return { success: false, error: '数据点不足，至少需要5个数据点' };
    }

    const sortedPoints = [...dataPoints].sort((a, b) => a.time_value - b.time_value);
    
    const n = sortedPoints.length;
    const slopes = [];
    
    for (let i = 1; i < n; i++) {
        const deltaT = sortedPoints[i].temperature - sortedPoints[i-1].temperature;
        const deltaTime = sortedPoints[i].time_value - sortedPoints[i-1].time_value;
        if (deltaTime !== 0) {
            slopes.push({
                index: i,
                slope: deltaT / deltaTime,
                time: (sortedPoints[i].time_value + sortedPoints[i-1].time_value) / 2,
                temperature: (sortedPoints[i].temperature + sortedPoints[i-1].temperature) / 2
            });
        }
    }
    
    if (slopes.length < 3) {
        return { success: false, error: '无法计算足够的斜率' };
    }
    
    const slopeChanges = [];
    for (let i = 1; i < slopes.length; i++) {
        slopeChanges.push({
            index: i,
            change: Math.abs(slopes[i].slope - slopes[i-1].slope),
            point: slopes[i]
        });
    }
    
    const smoothedChanges = smoothData(slopeChanges.map(s => s.change), 3);
    
    let maxChangeIndex = 0;
    let maxChange = 0;
    const startIdx = Math.floor(smoothedChanges.length * 0.1);
    const endIdx = Math.floor(smoothedChanges.length * 0.9);
    
    for (let i = startIdx; i < endIdx; i++) {
        if (smoothedChanges[i] > maxChange) {
            maxChange = smoothedChanges[i];
            maxChangeIndex = i;
        }
    }
    
    const transitionPoint = slopeChanges[maxChangeIndex + 1] || slopeChanges[maxChangeIndex];
    
    if (!transitionPoint) {
        return { success: false, error: '未检测到相变点' };
    }
    
    const phaseTransitionTemp = transitionPoint.point.temperature;
    const phaseTransitionTime = transitionPoint.point.time;
    
    return {
        success: true,
        phaseTransition: {
            temperature: Math.round(phaseTransitionTemp * 100) / 100,
            time: Math.round(phaseTransitionTime * 100) / 100,
            x: phaseTransitionTime,
            y: phaseTransitionTemp
        },
        details: {
            dataPointsCount: n,
            maxSlopeChange: maxChange,
            slopes: slopes.map(s => s.slope)
        }
    };
}

function smoothData(data, windowSize) {
    const result = [];
    const halfWindow = Math.floor(windowSize / 2);
    
    for (let i = 0; i < data.length; i++) {
        let sum = 0;
        let count = 0;
        for (let j = Math.max(0, i - halfWindow); j <= Math.min(data.length - 1, i + halfWindow); j++) {
            sum += data[j];
            count++;
        }
        result.push(sum / count);
    }
    
    return result;
}

module.exports = { calculatePhaseTransition };
