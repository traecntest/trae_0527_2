const express = require('express');
const router = express.Router();
const experimentController = require('../controllers/experimentController');

router.post('/', experimentController.createExperiment);
router.get('/', experimentController.getExperiments);
router.get('/:id', experimentController.getExperimentById);
router.put('/:id', experimentController.updateExperiment);
router.delete('/:id', experimentController.deleteExperiment);
router.post('/data-points/batch', experimentController.batchInsertDataPoints);
router.get('/:experiment_id/data-points', experimentController.getDataPoints);
router.get('/:experiment_id/calculate', experimentController.calculatePhaseTransition);

module.exports = router;
