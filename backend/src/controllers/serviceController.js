const pool = require('../config/db');
const fail=(message,statusCode=400)=>Object.assign(new Error(message),{statusCode});
const getAllServices=async(req,res,next)=>{try{const includeInactive = req.user && ['ADMIN','PROFESIONAL'].includes(req.user.rol);
 const [rows]=await pool.query(`SELECT id,nombre,descripcion,precio,duracion_minutos,COALESCE(activo,1) AS activo FROM Servicios ${includeInactive?'':'WHERE COALESCE(activo,1)=1'} ORDER BY nombre`);res.json({success:true,data:rows});}catch(e){next(e);}};
const createService=async(req,res,next)=>{try{
 const nombre=String(req.body.nombre||'').trim(), descripcion=String(req.body.descripcion||'').trim();
 const precio=Number(req.body.precio), duracion=Number(req.body.duracion_minutos);
 if(nombre.length<2||nombre.length>100)throw fail('El nombre debe tener entre 2 y 100 caracteres.');
 if(!Number.isFinite(precio)||precio<0)throw fail('El precio no es válido.');
 if(!Number.isInteger(duracion)||duracion<1||duracion>1440)throw fail('La duración debe estar entre 1 y 1440 minutos.');
 const [r]=await pool.query('INSERT INTO Servicios (nombre,descripcion,precio,duracion_minutos,activo) VALUES (?,?,?,?,1)',[nombre,descripcion||null,precio,duracion]);
 res.status(201).json({success:true,message:'Servicio creado.',data:{id:r.insertId}});
 }catch(e){next(e);}};
const updateService=async(req,res,next)=>{try{
 const id=Number(req.params.id);if(!Number.isInteger(id)||id<1)throw fail('Servicio inválido.');
 const [rows]=await pool.query('SELECT * FROM Servicios WHERE id=?',[id]);if(!rows.length)throw fail('Servicio no encontrado.',404);
 const current=rows[0], b=req.body;
 const nombre=b.nombre===undefined?current.nombre:String(b.nombre).trim();
 const descripcion=b.descripcion===undefined?current.descripcion:String(b.descripcion).trim();
 const precio=b.precio===undefined?Number(current.precio):Number(b.precio);
 const duracion=b.duracion_minutos===undefined?Number(current.duracion_minutos):Number(b.duracion_minutos);
 const activo=b.activo===undefined?1:(b.activo?1:0);
 if(nombre.length<2||nombre.length>100||!Number.isFinite(precio)||precio<0||!Number.isInteger(duracion)||duracion<1||duracion>1440)throw fail('Revisa nombre, precio y duración.');
 await pool.query('UPDATE Servicios SET nombre=?,descripcion=?,precio=?,duracion_minutos=?,activo=? WHERE id=?',[nombre,descripcion||null,precio,duracion,activo,id]);
 res.json({success:true,message:'Servicio actualizado.'});
 }catch(e){next(e);}};
module.exports={getAllServices,createService,updateService};
