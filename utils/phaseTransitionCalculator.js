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
            slopeData: slopes[i]
        });
    }
    
    const smoothedChanges = smoothData(slopeChanges.map(s => s.change), 3);
    
    const startIdx = Math.floor(smoothedChanges.length * 0.1);
    const endIdx = Math.floor(smoothedChanges.length * 0.9);
    
    const maxChange = Math.max(...smoothedChanges.slice(startIdx, endIdx));
    const threshold = maxChange * 0.3;
    
    const peaks = findPeaks(smoothedChanges, startIdx, endIdx, threshold);
    
    if (peaks.length === 0) {
        return { success: false, error: '未检测到显著的相变点' };
    }
    
    const phaseTransitions = peaks.map((peakIdx, idx) => {
        const transitionPoint = slopeChanges[peakIdx + 1] || slopeChanges[peakIdx];
        return {
            id: idx + 1,
            name: `相变点 ${idx + 1}`,
            temperature: Math.round(transitionPoint.slopeData.temperature * 100) / 100,
            time: Math.round(transitionPoint.slopeData.time * 100) / 100,
            x: transitionPoint.slopeData.time,
            y: transitionPoint.slopeData.temperature,
            slopeChange: smoothedChanges[peakIdx],
            confidence: Math.round((smoothedChanges[peakIdx] / maxChange) * 100)
        };
    });
    
    phaseTransitions.sort((a, b) => a.temperature - b.temperature);
    
    if (phaseTransitions.length >= 2) {
        phaseTransitions[0].name = '相变点 Ac1/Ar1';
        if (phaseTransitions.length >= 3) {
            phaseTransitions[phaseTransitions.length - 1].name = '相变点 Ac3/Ar3';
        }
    }
    
    return {
        success: true,
        phaseTransition: phaseTransitions[0],
        phaseTransitions: phaseTransitions,
        details: {
            dataPointsCount: n,
            maxSlopeChange: maxChange,
            threshold: threshold,
            slopes: slopes.map(s => s.slope),
            slopeChanges: smoothedChanges
        }
    };
}

function findPeaks(data, startIdx, endIdx, threshold) {
    const peaks = [];
    
    for (let i = startIdx; i < endIdx; i++) {
        if (data[i] < threshold) continue;
        
        const isPeak = 
            (i === startIdx || data[i] >= data[i - 1]) &&
            (i === endIdx - 1 || data[i] >= data[i + 1]);
        
        if (isPeak) {
            peaks.push(i);
        }
    }
    
    const minDistance = Math.floor(data.length * 0.1);
    const filteredPeaks = [];
    peaks.sort((a, b) => data[b] - data[a]);
    
    for (const peak of peaks) {
        const tooClose = filteredPeaks.some(p => Math.abs(p - peak) < minDistance);
        if (!tooClose) {
            filteredPeaks.push(peak);
        }
    }
    
    return filteredPeaks.sort((a, b) => a - b);
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
