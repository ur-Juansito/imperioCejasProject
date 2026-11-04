const express = require('express');
const router = express.Router();
const professionalController = require('../controllers/professionalController');
router.get('/', professionalController.getAllProfessionals);
module.exports = router;
