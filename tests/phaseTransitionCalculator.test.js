const { calculatePhaseTransition } = require('../utils/phaseTransitionCalculator');

describe('Phase Transition Calculator', () => {
    
    describe('Input Validation', () => {
        test('should return error for empty data', () => {
            const result = calculatePhaseTransition([]);
            expect(result.success).toBe(false);
            expect(result.error).toBeDefined();
        });

        test('should return error for less than 5 data points', () => {
            const dataPoints = [
                { time_value: 0, temperature: 25 },
                { time_value: 10, temperature: 100 },
                { time_value: 20, temperature: 180 },
                { time_value: 30, temperature: 260 }
            ];
            const result = calculatePhaseTransition(dataPoints);
            expect(result.success).toBe(false);
        });
    });

    describe('Heating Curve Phase Transition Detection', () => {
        test('should detect phase transition in heating curve', () => {
            const dataPoints = [];
            for (let i = 0; i <= 50; i++) {
                let temp;
                const time = i * 10;
                
                if (time < 100) {
                    temp = 25 + time * 5;
                } else if (time < 200) {
                    temp = 525 + (time - 100) * 1;
                } else {
                    temp = 625 + (time - 200) * 4;
                }
                
                dataPoints.push({ time_value: time, temperature: temp });
            }

            const result = calculatePhaseTransition(dataPoints);
            
            expect(result.success).toBe(true);
            expect(result.phaseTransition).toBeDefined();
            expect(result.phaseTransition.temperature).toBeGreaterThan(500);
            expect(result.phaseTransition.temperature).toBeLessThan(650);
            expect(result.phaseTransition.time).toBeGreaterThan(90);
            expect(result.phaseTransition.time).toBeLessThan(210);
        });
    });

    describe('Cooling Curve Phase Transition Detection', () => {
        test('should detect phase transition in cooling curve', () => {
            const dataPoints = [];
            for (let i = 0; i <= 50; i++) {
                let temp;
                const time = i * 10;
                
                if (time < 100) {
                    temp = 600 - time * 4;
                } else if (time < 200) {
                    temp = 200 - (time - 100) * 0.5;
                } else {
                    temp = 150 - (time - 200) * 3;
                }
                
                dataPoints.push({ time_value: time, temperature: temp });
            }

            const result = calculatePhaseTransition(dataPoints);
            
            expect(result.success).toBe(true);
            expect(result.phaseTransition).toBeDefined();
            expect(result.phaseTransition.temperature).toBeGreaterThan(100);
            expect(result.phaseTransition.temperature).toBeLessThan(300);
        });
    });

    describe('Steel-like Heating Curve', () => {
        test('should detect Ac1 phase transition around 727°C for steel', () => {
            const dataPoints = [
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
            ];

            const result = calculatePhaseTransition(dataPoints);
            
            expect(result.success).toBe(true);
            expect(result.phaseTransition).toBeDefined();
            expect(result.phaseTransition.temperature).toBeGreaterThan(600);
            expect(result.phaseTransition.temperature).toBeLessThan(850);
        });
    });

    describe('Linear Data (No Transition)', () => {
        test('should handle perfectly linear data without errors', () => {
            const dataPoints = [];
            for (let i = 0; i < 20; i++) {
                dataPoints.push({ time_value: i * 10, temperature: 25 + i * 50 });
            }

            const result = calculatePhaseTransition(dataPoints);
            expect(result.success).toBe(true);
            expect(result.phaseTransition).toBeDefined();
        });
    });

    describe('Unsorted Data Points', () => {
        test('should handle unsorted data points correctly', () => {
            const dataPoints = [
                { time_value: 50, temperature: 300 },
                { time_value: 0, temperature: 25 },
                { time_value: 100, temperature: 600 },
                { time_value: 30, temperature: 180 },
                { time_value: 80, temperature: 500 },
                { time_value: 10, temperature: 80 },
                { time_value: 120, temperature: 720 },
                { time_value: 150, temperature: 780 },
                { time_value: 180, temperature: 850 },
                { time_value: 200, temperature: 950 }
            ];

            const result = calculatePhaseTransition(dataPoints);
            expect(result.success).toBe(true);
            expect(result.phaseTransition).toBeDefined();
        });
    });

    describe('Result Structure', () => {
        test('should return correct result structure', () => {
            const dataPoints = [];
            for (let i = 0; i < 10; i++) {
                dataPoints.push({ time_value: i * 10, temperature: 25 + i * 50 });
            }

            const result = calculatePhaseTransition(dataPoints);
            
            expect(result.success).toBe(true);
            expect(result.phaseTransition).toHaveProperty('temperature');
            expect(result.phaseTransition).toHaveProperty('time');
            expect(result.phaseTransition).toHaveProperty('x');
            expect(result.phaseTransition).toHaveProperty('y');
            expect(result.details).toHaveProperty('dataPointsCount');
            expect(result.details).toHaveProperty('slopes');
            expect(typeof result.phaseTransition.temperature).toBe('number');
            expect(typeof result.phaseTransition.time).toBe('number');
        });

        test('should round temperature to 2 decimal places', () => {
            const dataPoints = [];
            for (let i = 0; i < 10; i++) {
                dataPoints.push({ time_value: i * 10, temperature: 25.12345 + i * 50 });
            }

            const result = calculatePhaseTransition(dataPoints);
            const tempStr = result.phaseTransition.temperature.toString();
            const decimalPlaces = tempStr.split('.')[1] 
                ? tempStr.split('.')[1].length 
                : 0;
            expect(decimalPlaces).toBeLessThanOrEqual(2);
        });
    });
});
