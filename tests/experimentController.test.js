jest.mock('../config/database', () => ({
    useInMemory: jest.fn(() => true),
    getInMemoryPool: jest.fn(),
    getPool: jest.fn()
}));

const db = require('../config/database');
const experimentController = require('../controllers/experimentController');

describe('Experiment Controller Tests', () => {
    let mockPool;
    let mockRequest;
    let mockResponse;

    beforeEach(() => {
        mockPool = {
            execute: jest.fn()
        };
        
        db.getInMemoryPool.mockReturnValue(mockPool);
        db.useInMemory.mockReturnValue(true);
        
        mockRequest = {
            body: {},
            params: {}
        };
        
        mockResponse = {
            status: jest.fn(() => mockResponse),
            json: jest.fn()
        };
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('createExperiment', () => {
        test('should create experiment successfully', async () => {
            mockRequest.body = {
                name: '测试实验',
                material: '测试材料',
                experiment_type: 'heating',
                description: '测试描述'
            };
            
            mockPool.execute.mockResolvedValue([{ insertId: 1 }]);
            
            await experimentController.createExperiment(mockRequest, mockResponse);
            
            expect(mockPool.execute).toHaveBeenCalled();
            expect(mockResponse.status).toHaveBeenCalledWith(201);
            expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({
                success: true,
                data: expect.objectContaining({
                    id: 1,
                    name: '测试实验'
                })
            }));
        });

        test('should return 400 when required fields missing', async () => {
            mockRequest.body = {
                name: '测试实验'
            };
            
            await experimentController.createExperiment(mockRequest, mockResponse);
            
            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({
                success: false,
                error: expect.any(String)
            }));
        });

        test('should handle database errors', async () => {
            mockRequest.body = {
                name: '测试实验',
                material: '测试材料',
                experiment_type: 'heating'
            };
            
            mockPool.execute.mockRejectedValue(new Error('Database error'));
            
            await experimentController.createExperiment(mockRequest, mockResponse);
            
            expect(mockResponse.status).toHaveBeenCalledWith(500);
            expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({
                success: false
            }));
        });
    });

    describe('getExperiments', () => {
        test('should return all experiments', async () => {
            const mockExperiments = [
                { id: 1, name: '实验1', material: '材料1', experiment_type: 'heating' },
                { id: 2, name: '实验2', material: '材料2', experiment_type: 'cooling' }
            ];
            
            mockPool.execute.mockResolvedValue([mockExperiments]);
            
            await experimentController.getExperiments(mockRequest, mockResponse);
            
            expect(mockPool.execute).toHaveBeenCalled();
            expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({
                success: true,
                data: mockExperiments
            }));
        });

        test('should handle database errors', async () => {
            mockPool.execute.mockRejectedValue(new Error('Database error'));
            
            await experimentController.getExperiments(mockRequest, mockResponse);
            
            expect(mockResponse.status).toHaveBeenCalledWith(500);
        });
    });

    describe('getExperimentById', () => {
        test('should return experiment by id', async () => {
            const mockExperiment = { 
                id: 1, 
                name: '实验1', 
                material: '材料1', 
                experiment_type: 'heating' 
            };
            
            mockRequest.params = { id: 1 };
            mockPool.execute.mockResolvedValue([[mockExperiment]]);
            
            await experimentController.getExperimentById(mockRequest, mockResponse);
            
            expect(mockPool.execute).toHaveBeenCalled();
            expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({
                success: true,
                data: mockExperiment
            }));
        });

        test('should return 404 when experiment not found', async () => {
            mockRequest.params = { id: 999 };
            mockPool.execute.mockResolvedValue([[]]);
            
            await experimentController.getExperimentById(mockRequest, mockResponse);
            
            expect(mockResponse.status).toHaveBeenCalledWith(404);
            expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({
                success: false,
                error: '实验不存在'
            }));
        });
    });

    describe('updateExperiment', () => {
        test('should update experiment successfully', async () => {
            mockRequest.params = { id: 1 };
            mockRequest.body = {
                name: '更新后的实验',
                material: '更新后的材料',
                experiment_type: 'cooling',
                description: '更新后的描述'
            };
            
            mockPool.execute.mockResolvedValue([{ affectedRows: 1 }]);
            
            await experimentController.updateExperiment(mockRequest, mockResponse);
            
            expect(mockPool.execute).toHaveBeenCalled();
            expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({
                success: true,
                data: expect.objectContaining({
                    id: 1,
                    name: '更新后的实验'
                })
            }));
        });

        test('should return 404 when experiment not found', async () => {
            mockRequest.params = { id: 999 };
            mockRequest.body = {
                name: '更新后的实验',
                material: '更新后的材料',
                experiment_type: 'cooling'
            };
            
            mockPool.execute.mockResolvedValue([{ affectedRows: 0 }]);
            
            await experimentController.updateExperiment(mockRequest, mockResponse);
            
            expect(mockResponse.status).toHaveBeenCalledWith(404);
        });

        test('should return 400 when required fields missing', async () => {
            mockRequest.params = { id: 1 };
            mockRequest.body = {
                name: '更新后的实验'
            };
            
            await experimentController.updateExperiment(mockRequest, mockResponse);
            
            expect(mockResponse.status).toHaveBeenCalledWith(400);
        });
    });

    describe('deleteExperiment', () => {
        test('should delete experiment successfully', async () => {
            mockRequest.params = { id: 1 };
            mockPool.execute.mockResolvedValue([{ affectedRows: 1 }]);
            
            await experimentController.deleteExperiment(mockRequest, mockResponse);
            
            expect(mockPool.execute).toHaveBeenCalled();
            expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({
                success: true,
                message: '实验删除成功'
            }));
        });

        test('should return 404 when experiment not found', async () => {
            mockRequest.params = { id: 999 };
            mockPool.execute.mockResolvedValue([{ affectedRows: 0 }]);
            
            await experimentController.deleteExperiment(mockRequest, mockResponse);
            
            expect(mockResponse.status).toHaveBeenCalledWith(404);
        });
    });

    describe('batchInsertDataPoints', () => {
        test('should batch insert data points successfully', async () => {
            mockRequest.body = {
                experiment_id: 1,
                data_points: [
                    { time_value: 0, temperature: 25 },
                    { time_value: 10, temperature: 100 },
                    { time_value: 20, temperature: 180 },
                    { time_value: 30, temperature: 260 },
                    { time_value: 40, temperature: 340 }
                ]
            };
            
            mockPool.execute.mockResolvedValue([{ affectedRows: 5 }]);
            
            await experimentController.batchInsertDataPoints(mockRequest, mockResponse);
            
            expect(mockPool.execute).toHaveBeenCalled();
            expect(mockResponse.status).toHaveBeenCalledWith(201);
            expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({
                success: true,
                data: expect.objectContaining({
                    insertedCount: 5
                })
            }));
        });

        test('should return 400 when experiment_id missing', async () => {
            mockRequest.body = {
                data_points: [
                    { time_value: 0, temperature: 25 },
                    { time_value: 10, temperature: 100 },
                    { time_value: 20, temperature: 180 },
                    { time_value: 30, temperature: 260 },
                    { time_value: 40, temperature: 340 }
                ]
            };
            
            await experimentController.batchInsertDataPoints(mockRequest, mockResponse);
            
            expect(mockResponse.status).toHaveBeenCalledWith(400);
        });

        test('should return 400 when less than 5 data points', async () => {
            mockRequest.body = {
                experiment_id: 1,
                data_points: [
                    { time_value: 0, temperature: 25 },
                    { time_value: 10, temperature: 100 },
                    { time_value: 20, temperature: 180 },
                    { time_value: 30, temperature: 260 }
                ]
            };
            
            await experimentController.batchInsertDataPoints(mockRequest, mockResponse);
            
            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({
                error: '至少需要5个数据点'
            }));
        });

        test('should return 400 when data points empty', async () => {
            mockRequest.body = {
                experiment_id: 1,
                data_points: []
            };
            
            await experimentController.batchInsertDataPoints(mockRequest, mockResponse);
            
            expect(mockResponse.status).toHaveBeenCalledWith(400);
        });

        test('should return 400 when invalid data points', async () => {
            mockRequest.body = {
                experiment_id: 1,
                data_points: [
                    { time_value: 0, temperature: 25 },
                    { time_value: 10, temperature: 100 },
                    { time_value: 20, temp: 180 },
                    { time_value: 30, temperature: 260 },
                    { time_value: 40, temperature: 340 }
                ]
            };
            
            await experimentController.batchInsertDataPoints(mockRequest, mockResponse);
            
            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({
                error: '存在无效数据点，请检查数据格式'
            }));
        });

        test('should return 400 when data_points not array', async () => {
            mockRequest.body = {
                experiment_id: 1,
                data_points: 'not an array'
            };
            
            await experimentController.batchInsertDataPoints(mockRequest, mockResponse);
            
            expect(mockResponse.status).toHaveBeenCalledWith(400);
        });
    });

    describe('getDataPoints', () => {
        test('should return data points for experiment', async () => {
            const mockDataPoints = [
                { id: 1, experiment_id: 1, time_value: 0, temperature: 25 },
                { id: 2, experiment_id: 1, time_value: 10, temperature: 100 }
            ];
            
            mockRequest.params = { experiment_id: 1 };
            mockPool.execute.mockResolvedValue([mockDataPoints]);
            
            await experimentController.getDataPoints(mockRequest, mockResponse);
            
            expect(mockPool.execute).toHaveBeenCalled();
            expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({
                success: true,
                data: mockDataPoints
            }));
        });
    });

    describe('calculatePhaseTransition', () => {
        test('should calculate phase transition successfully', async () => {
            const mockDataPoints = [];
            for (let i = 0; i < 20; i++) {
                mockDataPoints.push({ 
                    time_value: i * 10, 
                    temperature: 25 + i * 45 
                });
            }
            
            mockRequest.params = { experiment_id: 1 };
            mockPool.execute.mockResolvedValue([mockDataPoints]);
            
            await experimentController.calculatePhaseTransition(mockRequest, mockResponse);
            
            expect(mockPool.execute).toHaveBeenCalled();
            expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({
                success: true,
                phaseTransition: expect.objectContaining({
                    temperature: expect.any(Number),
                    time: expect.any(Number)
                })
            }));
        });

        test('should return 404 when no data points found', async () => {
            mockRequest.params = { experiment_id: 999 };
            mockPool.execute.mockResolvedValue([[]]);
            
            await experimentController.calculatePhaseTransition(mockRequest, mockResponse);
            
            expect(mockResponse.status).toHaveBeenCalledWith(404);
            expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({
                success: false,
                error: '未找到该实验的数据点'
            }));
        });
    });

    describe('Error Handling', () => {
        test('should handle unexpected errors in getExperiments', async () => {
            mockPool.execute.mockRejectedValue(new Error('Unexpected error'));
            
            await experimentController.getExperiments(mockRequest, mockResponse);
            
            expect(mockResponse.status).toHaveBeenCalledWith(500);
            expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({
                success: false,
                error: expect.any(String)
            }));
        });

        test('should handle unexpected errors in batchInsertDataPoints', async () => {
            mockRequest.body = {
                experiment_id: 1,
                data_points: [
                    { time_value: 0, temperature: 25 },
                    { time_value: 10, temperature: 100 },
                    { time_value: 20, temperature: 180 },
                    { time_value: 30, temperature: 260 },
                    { time_value: 40, temperature: 340 }
                ]
            };
            
            mockPool.execute.mockRejectedValue(new Error('Unexpected error'));
            
            await experimentController.batchInsertDataPoints(mockRequest, mockResponse);
            
            expect(mockResponse.status).toHaveBeenCalledWith(500);
        });
    });
});
