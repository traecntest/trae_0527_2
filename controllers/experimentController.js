const pool = require('../config/database');
const { calculatePhaseTransition } = require('../utils/phaseTransitionCalculator');

const experimentController = {
    async createExperiment(req, res) {
        try {
            const { name, material, experiment_type, description } = req.body;
            
            if (!name || !material || !experiment_type) {
                return res.status(400).json({
                    success: false,
                    error: '缺少必要参数：name, material, experiment_type'
                });
            }
            
            const [result] = await pool.execute(
                'INSERT INTO experiments (name, material, experiment_type, description) VALUES (?, ?, ?, ?)',
                [name, material, experiment_type, description || '']
            );
            
            res.status(201).json({
                success: true,
                data: {
                    id: result.insertId,
                    name,
                    material,
                    experiment_type,
                    description
                }
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    },

    async getExperiments(req, res) {
        try {
            const [rows] = await pool.execute(
                'SELECT * FROM experiments ORDER BY created_at DESC'
            );
            
            res.json({
                success: true,
                data: rows
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    },

    async getExperimentById(req, res) {
        try {
            const { id } = req.params;
            const [rows] = await pool.execute(
                'SELECT * FROM experiments WHERE id = ?',
                [id]
            );
            
            if (rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    error: '实验不存在'
                });
            }
            
            res.json({
                success: true,
                data: rows[0]
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    },

    async updateExperiment(req, res) {
        try {
            const { id } = req.params;
            const { name, material, experiment_type, description } = req.body;
            
            if (!name || !material || !experiment_type) {
                return res.status(400).json({
                    success: false,
                    error: '缺少必要参数：name, material, experiment_type'
                });
            }
            
            const [result] = await pool.execute(
                'UPDATE experiments SET name = ?, material = ?, experiment_type = ?, description = ? WHERE id = ?',
                [name, material, experiment_type, description || '', id]
            );
            
            if (result.affectedRows === 0) {
                return res.status(404).json({
                    success: false,
                    error: '实验不存在'
                });
            }
            
            res.json({
                success: true,
                data: {
                    id: parseInt(id),
                    name,
                    material,
                    experiment_type,
                    description
                }
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    },

    async deleteExperiment(req, res) {
        try {
            const { id } = req.params;
            
            const [result] = await pool.execute(
                'DELETE FROM experiments WHERE id = ?',
                [id]
            );
            
            if (result.affectedRows === 0) {
                return res.status(404).json({
                    success: false,
                    error: '实验不存在'
                });
            }
            
            res.json({
                success: true,
                message: '实验删除成功'
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    },

    async batchInsertDataPoints(req, res) {
        try {
            const { experiment_id, data_points } = req.body;
            
            if (!experiment_id || !data_points || !Array.isArray(data_points)) {
                return res.status(400).json({
                    success: false,
                    error: '缺少必要参数：experiment_id, data_points(数组)'
                });
            }
            
            if (data_points.length === 0) {
                return res.status(400).json({
                    success: false,
                    error: '数据点数组不能为空'
                });
            }
            
            const values = data_points.map(point => [
                experiment_id,
                point.time_value,
                point.temperature
            ]);
            
            const placeholders = data_points.map(() => '(?, ?, ?)').join(', ');
            const flatValues = values.flat();
            
            const [result] = await pool.execute(
                `INSERT INTO data_points (experiment_id, time_value, temperature) VALUES ${placeholders}`,
                flatValues
            );
            
            res.status(201).json({
                success: true,
                data: {
                    insertedCount: result.affectedRows,
                    experiment_id
                }
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    },

    async getDataPoints(req, res) {
        try {
            const { experiment_id } = req.params;
            const [rows] = await pool.execute(
                'SELECT * FROM data_points WHERE experiment_id = ? ORDER BY time_value',
                [experiment_id]
            );
            
            res.json({
                success: true,
                data: rows
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    },

    async calculatePhaseTransition(req, res) {
        try {
            const { experiment_id } = req.params;
            
            const [rows] = await pool.execute(
                'SELECT time_value, temperature FROM data_points WHERE experiment_id = ? ORDER BY time_value',
                [experiment_id]
            );
            
            if (rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    error: '未找到该实验的数据点'
                });
            }
            
            const result = calculatePhaseTransition(rows);
            
            if (!result.success) {
                return res.status(400).json(result);
            }
            
            res.json({
                success: true,
                experiment_id: parseInt(experiment_id),
                phaseTransition: result.phaseTransition,
                details: result.details
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }
};

module.exports = experimentController;
