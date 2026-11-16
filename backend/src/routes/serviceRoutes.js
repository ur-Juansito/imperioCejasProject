const express=require('express');
const router=express.Router();
const c=require('../controllers/serviceController');
const {verifyToken}=require('../middlewares/authMiddleware');
const {checkRole}=require('../middlewares/roleMiddleware');
router.get('/',(req,res,next)=>{const h=req.headers.authorization;if(h&&h.startsWith('Bearer '))return verifyToken(req,res,next);next();},c.getAllServices);
router.post('/',verifyToken,checkRole(['ADMIN','PROFESIONAL']),c.createService);
router.patch('/:id',verifyToken,checkRole(['ADMIN','PROFESIONAL']),c.updateService);
module.exports=router;
