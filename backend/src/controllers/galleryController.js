const pool=require('../config/db');
exports.list=async(req,res,next)=>{try{const [rows]=await pool.query(`SELECT g.id,g.url_imagen,g.descripcion,g.fecha_subida,p.nombre_completo AS profesional_nombre FROM Galeria g LEFT JOIN Profesionales p ON p.id=g.profesional_id ORDER BY g.fecha_subida DESC LIMIT 12`);res.json({success:true,data:rows});}catch(e){next(e);}};
