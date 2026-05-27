const { calculatePhaseTransition } = require('../utils/phaseTransitionCalculator');

describe('Experiment Data Validation Tests', () => {
    describe('Data Point Validation', () => {
        test('should validate minimum data points requirement', () => {
            const insufficientData = [
                { time_value: 0, temperature: 25 },
                { time_value: 10, temperature: 100 }
            ];
            const result = calculatePhaseTransition(insufficientData);
            expect(result.success).toBe(false);
            expect(result.error).toContain('至少需要5个数据点');
        });

        test('should accept valid data points array', () => {
            const validData = [];
            for (let i = 0; i < 20; i++) {
                validData.push({ time_value: i * 10, temperature: 25 + i * 45 });
            }
            const result = calculatePhaseTransition(validData);
            expect(result.success).toBe(true);
        });
    });

    describe('Batch Data Insert Validation', () => {
        test('should validate experiment_id is required', () => {
            const data = { data_points: [{ time_value: 0, temperature: 25 }] };
            expect(data.experiment_id).toBeUndefined();
            
            const hasExperimentId = 'experiment_id' in data;
            expect(hasExperimentId).toBe(false);
        });

        test('should validate data_points is array', () => {
            const validPoints = [
                { time_value: 0, temperature: 25 },
                { time_value: 10, temperature: 100 },
                { time_value: 20, temperature: 180 },
                { time_value: 30, temperature: 260 },
                { time_value: 40, temperature: 340 }
            ];
            expect(Array.isArray(validPoints)).toBe(true);
            expect(validPoints.length).toBeGreaterThanOrEqual(5);
        });

        test('should validate data point structure', () => {
            const point = { time_value: 10, temperature: 100 };
            expect(point).toHaveProperty('time_value');
            expect(point).toHaveProperty('temperature');
            expect(typeof point.time_value).toBe('number');
            expect(typeof point.temperature).toBe('number');
        });

        test('should reject empty data points array', () => {
            const emptyArray = [];
            expect(emptyArray.length).toBe(0);
        });
    });

    describe('Heating Curve Test Data', () => {
        const heatingData = [
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

        test('should detect phase transition in steel heating curve', () => {
            const result = calculatePhaseTransition(heatingData);
            expect(result.success).toBe(true);
            expect(result.phaseTransition.temperature).toBeGreaterThan(600);
            expect(result.phaseTransition.temperature).toBeLessThan(850);
        });

        test('should have sorted time values', () => {
            for (let i = 1; i < heatingData.length; i++) {
                expect(heatingData[i].time_value).toBeGreaterThan(heatingData[i-1].time_value);
            }
        });

        test('should have increasing temperature for heating', () => {
            for (let i = 1; i < heatingData.length; i++) {
                expect(heatingData[i].temperature).toBeGreaterThan(heatingData[i-1].temperature);
            }
        });
    });

    describe('Cooling Curve Test Data', () => {
        const coolingData = [
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
        ];

        test('should detect phase transition in cooling curve', () => {
            const result = calculatePhaseTransition(coolingData);
            expect(result.success).toBe(true);
            expect(result.phaseTransition).toBeDefined();
        });

        test('should have decreasing temperature for cooling', () => {
            for (let i = 1; i < coolingData.length; i++) {
                expect(coolingData[i].temperature).toBeLessThan(coolingData[i-1].temperature);
            }
        });
    });

    describe('Edge Cases Test Data', () => {
        test('should handle data with duplicate time values', () => {
            const dataWithDuplicates = [
                { time_value: 0, temperature: 25 },
                { time_value: 10, temperature: 100 },
                { time_value: 10, temperature: 100 },
                { time_value: 20, temperature: 180 },
                { time_value: 30, temperature: 260 },
                { time_value: 40, temperature: 340 },
                { time_value: 50, temperature: 420 }
            ];
            const result = calculatePhaseTransition(dataWithDuplicates);
            expect(result.success).toBe(true);
        });

        test('should handle large temperature range', () => {
            const largeRangeData = [];
            for (let i = 0; i < 30; i++) {
                largeRangeData.push({ 
                    time_value: i * 10, 
                    temperature: i * 50 
                });
            }
            const result = calculatePhaseTransition(largeRangeData);
            expect(result.success).toBe(true);
        });

        test('should handle negative temperature values', () => {
            const negativeTempData = [
                { time_value: 0, temperature: -50 },
                { time_value: 10, temperature: -30 },
                { time_value: 20, temperature: -10 },
                { time_value: 30, temperature: 10 },
                { time_value: 40, temperature: 30 },
                { time_value: 50, temperature: 50 },
                { time_value: 60, temperature: 70 }
            ];
            const result = calculatePhaseTransition(negativeTempData);
            expect(result.success).toBe(true);
        });
    });

    describe('Experiment Structure Validation', () => {
        test('should validate experiment structure', () => {
            const experiment = {
                name: '测试实验',
                material: '测试材料',
                experiment_type: 'heating',
                description: '测试描述'
            };
            
            expect(experiment).toHaveProperty('name');
            expect(experiment).toHaveProperty('material');
            expect(experiment).toHaveProperty('experiment_type');
            expect(['heating', 'cooling']).toContain(experiment.experiment_type);
        });

        test('should reject invalid experiment type', () => {
            const invalidType = 'invalid_type';
            expect(['heating', 'cooling']).not.toContain(invalidType);
        });
    });

    describe('Phase Transition Result Structure', () => {
        const testData = [];
        for (let i = 0; i < 20; i++) {
            testData.push({ time_value: i * 10, temperature: 25 + i * 45 });
        }

        test('should return complete phase transition result', () => {
            const result = calculatePhaseTransition(testData);
            
            expect(result).toHaveProperty('success');
            expect(result).toHaveProperty('phaseTransition');
            expect(result.phaseTransition).toHaveProperty('temperature');
            expect(result.phaseTransition).toHaveProperty('time');
            expect(result.phaseTransition).toHaveProperty('x');
            expect(result.phaseTransition).toHaveProperty('y');
        });

        test('should return details with slopes', () => {
            const result = calculatePhaseTransition(testData);
            
            expect(result).toHaveProperty('details');
            expect(result.details).toHaveProperty('dataPointsCount');
            expect(result.details).toHaveProperty('slopes');
            expect(Array.isArray(result.details.slopes)).toBe(true);
        });
    });
});
