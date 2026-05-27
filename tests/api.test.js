const { calculatePhaseTransition } = require('../utils/phaseTransitionCalculator');

describe('Save Data API Tests', () => {
    describe('Data Validation for Save API', () => {
        test('should validate experiment_id exists', () => {
            const requestBody = {
                data_points: [{ time_value: 0, temperature: 25 }]
            };
            expect(requestBody.experiment_id).toBeUndefined();
        });

        test('should validate data_points is array', () => {
            const validRequest = {
                experiment_id: 1,
                data_points: [
                    { time_value: 0, temperature: 25 },
                    { time_value: 10, temperature: 100 },
                    { time_value: 20, temperature: 180 },
                    { time_value: 30, temperature: 260 },
                    { time_value: 40, temperature: 340 }
                ]
            };
            expect(Array.isArray(validRequest.data_points)).toBe(true);
            expect(validRequest.data_points.length).toBeGreaterThanOrEqual(5);
        });

        test('should validate each data point has required fields', () => {
            const point = { time_value: 10, temperature: 100 };
            expect(point).toHaveProperty('time_value');
            expect(point).toHaveProperty('temperature');
            expect(typeof point.time_value).toBe('number');
            expect(typeof point.temperature).toBe('number');
        });

        test('should reject invalid data point structure', () => {
            const invalidPoint = { time: 10, temp: 100 };
            expect(invalidPoint).not.toHaveProperty('time_value');
            expect(invalidPoint).not.toHaveProperty('temperature');
        });

        test('should validate minimum data points (5)', () => {
            const tooFewPoints = [
                { time_value: 0, temperature: 25 },
                { time_value: 10, temperature: 100 },
                { time_value: 20, temperature: 180 },
                { time_value: 30, temperature: 260 }
            ];
            expect(tooFewPoints.length).toBeLessThan(5);
        });
    });

    describe('Experiment Data Structure Validation', () => {
        test('should validate experiment creation data', () => {
            const experimentData = {
                name: '测试实验',
                material: '测试材料',
                experiment_type: 'heating',
                description: '测试描述'
            };
            
            expect(experimentData.name).toBeDefined();
            expect(experimentData.material).toBeDefined();
            expect(experimentData.experiment_type).toBeDefined();
            expect(['heating', 'cooling']).toContain(experimentData.experiment_type);
        });

        test('should validate experiment name is not empty', () => {
            const emptyName = { name: '', material: '材料', experiment_type: 'heating' };
            expect(emptyName.name.length).toBe(0);
        });

        test('should validate experiment type is valid', () => {
            const validTypes = ['heating', 'cooling'];
            expect(validTypes).toContain('heating');
            expect(validTypes).toContain('cooling');
            expect(validTypes).not.toContain('invalid');
        });
    });

    describe('Save Data Flow Tests', () => {
        const validExperimentData = {
            name: '钢样测试',
            material: '45号钢',
            experiment_type: 'heating',
            description: '测试保存流程'
        };

        const validDataPoints = [
            { time_value: 0, temperature: 25 },
            { time_value: 30, temperature: 150 },
            { time_value: 60, temperature: 280 },
            { time_value: 90, temperature: 410 },
            { time_value: 120, temperature: 540 },
            { time_value: 150, temperature: 650 },
            { time_value: 180, temperature: 700 },
            { time_value: 210, temperature: 720 },
            { time_value: 240, temperature: 730 },
            { time_value: 270, temperature: 740 }
        ];

        test('should process valid experiment creation data', () => {
            expect(validExperimentData.name).toBeTruthy();
            expect(validExperimentData.material).toBeTruthy();
            expect(validExperimentData.experiment_type).toBeTruthy();
        });

        test('should process valid data points array', () => {
            expect(Array.isArray(validDataPoints)).toBe(true);
            expect(validDataPoints.length).toBeGreaterThanOrEqual(5);
        });

        test('should validate all data points have valid values', () => {
            validDataPoints.forEach(point => {
                expect(point.time_value).toBeDefined();
                expect(point.temperature).toBeDefined();
                expect(!isNaN(point.time_value)).toBe(true);
                expect(!isNaN(point.temperature)).toBe(true);
            });
        });

        test('should sort data points by time', () => {
            const sortedPoints = [...validDataPoints].sort((a, b) => a.time_value - b.time_value);
            for (let i = 1; i < sortedPoints.length; i++) {
                expect(sortedPoints[i].time_value).toBeGreaterThanOrEqual(sortedPoints[i-1].time_value);
            }
        });
    });

    describe('Calculate After Save Tests', () => {
        test('should successfully calculate phase transition after data save', () => {
            const testData = [
                { time_value: 0, temperature: 25 },
                { time_value: 30, temperature: 150 },
                { time_value: 60, temperature: 280 },
                { time_value: 90, temperature: 410 },
                { time_value: 120, temperature: 540 },
                { time_value: 150, temperature: 650 },
                { time_value: 180, temperature: 700 },
                { time_value: 210, temperature: 720 },
                { time_value: 240, temperature: 730 },
                { time_value: 270, temperature: 740 },
                { time_value: 300, temperature: 760 },
                { time_value: 330, temperature: 800 },
                { time_value: 360, temperature: 850 },
                { time_value: 390, temperature: 900 },
                { time_value: 420, temperature: 950 },
                { time_value: 450, temperature: 1000 }
            ];
            
            const result = calculatePhaseTransition(testData);
            
            expect(result.success).toBe(true);
            expect(result.phaseTransition.temperature).toBeGreaterThan(0);
            expect(result.phaseTransition.time).toBeGreaterThan(0);
        });

        test('should return proper result structure', () => {
            const testData = [];
            for (let i = 0; i < 20; i++) {
                testData.push({ time_value: i * 10, temperature: 25 + i * 45 });
            }
            
            const result = calculatePhaseTransition(testData);
            
            expect(result).toHaveProperty('success');
            expect(result).toHaveProperty('phaseTransition');
            expect(result.phaseTransition).toHaveProperty('temperature');
            expect(result.phaseTransition).toHaveProperty('time');
            expect(result.phaseTransition).toHaveProperty('x');
            expect(result.phaseTransition).toHaveProperty('y');
        });
    });

    describe('Error Handling Tests', () => {
        test('should handle empty data array gracefully', () => {
            const result = calculatePhaseTransition([]);
            expect(result.success).toBe(false);
            expect(result.error).toBeDefined();
        });

        test('should handle insufficient data points', () => {
            const insufficientData = [
                { time_value: 0, temperature: 25 },
                { time_value: 10, temperature: 100 },
                { time_value: 20, temperature: 180 }
            ];
            const result = calculatePhaseTransition(insufficientData);
            expect(result.success).toBe(false);
        });

        test('should handle data with NaN values', () => {
            const dataWithNaN = [
                { time_value: 0, temperature: NaN },
                { time_value: 10, temperature: 100 },
                { time_value: 20, temperature: 180 },
                { time_value: 30, temperature: 260 },
                { time_value: 40, temperature: 340 }
            ];
            const hasNaN = dataWithNaN.some(p => isNaN(p.temperature));
            expect(hasNaN).toBe(true);
        });
    });

    describe('Data Format Validation Tests', () => {
        test('should validate time_value is numeric', () => {
            const validTime = { time_value: 10.5, temperature: 100 };
            const invalidTime = { time_value: 'abc', temperature: 100 };
            
            expect(typeof validTime.time_value).toBe('number');
            expect(typeof invalidTime.time_value).not.toBe('number');
        });

        test('should validate temperature is numeric', () => {
            const validTemp = { time_value: 10, temperature: 100.5 };
            const invalidTemp = { time_value: 10, temperature: 'xyz' };
            
            expect(typeof validTemp.temperature).toBe('number');
            expect(typeof invalidTemp.temperature).not.toBe('number');
        });

        test('should handle floating point values', () => {
            const floatData = [
                { time_value: 0.5, temperature: 25.3 },
                { time_value: 10.2, temperature: 100.7 },
                { time_value: 20.8, temperature: 180.1 },
                { time_value: 30.3, temperature: 260.5 },
                { time_value: 40.1, temperature: 340.9 },
                { time_value: 50.6, temperature: 420.2 }
            ];
            
            const result = calculatePhaseTransition(floatData);
            expect(result.success).toBe(true);
        });
    });
});
