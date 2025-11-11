const express = require('express');
const router = express.Router();
const { 
    createTimeRecord, 
    getAllTimeRecords, 
    deleteTimeRecord, 
    updateTimeRecord 
} = require('../controllers/timeRecordController');

router.post('/', createTimeRecord);
router.get('/', getAllTimeRecords);
router.delete('/:id_registro', deleteTimeRecord);
router.put('/:id_registro', updateTimeRecord);

module.exports = router;


