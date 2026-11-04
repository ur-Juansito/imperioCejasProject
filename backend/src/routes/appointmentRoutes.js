const express = require('express');
const router = express.Router();
const controller = require('../controllers/appointmentController');
const { verifyToken } = require('../middlewares/authMiddleware');
const { checkRole } = require('../middlewares/roleMiddleware');

router.use(verifyToken);
router.get('/availability', controller.getAvailability);
router.get('/', controller.getAllAppointments);
router.post('/', checkRole('CLIENTE'), controller.createAppointment);
router.patch('/:id/:action(confirmar|rechazar|cancelar|atendida)', controller.changeAppointmentStatus);

module.exports = router;
