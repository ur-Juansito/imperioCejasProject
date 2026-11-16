const express = require('express');
const router = express.Router();
const controller = require('../controllers/adminController');
const { verifyToken } = require('../middlewares/authMiddleware');
const { checkRole } = require('../middlewares/roleMiddleware');

router.use(verifyToken, checkRole('ADMIN'));
router.get('/users', controller.listUsers);
router.post('/professionals', controller.createProfessional);
router.delete('/users/:id', controller.deleteUser);

module.exports = router;
