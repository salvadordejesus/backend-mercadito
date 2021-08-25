'use strict'
const express = require('express');
const construccionController = require('../controllers/construccion');
const verificarTokenNegocio = require('../middlewares/auth_negocio');

var router = express.Router();

//SUBIDA DE ARCHIVO
const multer = require('multer');
const storage = multer.diskStorage(
    {
        destination:function (req , file , cb){
            try {
                if (typeof req.negocio_autentificado._id === 'undefined') {
                    return res.status(401).send({
                        status: "error",
                        message: "Usuario no identificado"
                    });
                }
            } catch (error) {
                return res.status(500).send({
                    status: "error",
                    message: "Usuario no identificado"
                });
            }
    
            var _idNegocio = req.negocio_autentificado._id;

            var rutaDestino = './uploads/';

            rutaDestino += _idNegocio + '/construccion';

            cb( null , rutaDestino );
         
        },

        filename: function(req, file, cb){
            cb(null,Date.now()+"_"+file.originalname);
        }
    }
);
const upload = multer( { storage: storage } );

//Rutas
/*GUARDADO DE LOS DATOS DEL PRODUCTO */
router.post('/save-data', verificarTokenNegocio , construccionController.saveData);
/*RECUPERACION DE TODOS LOS PRODUCTOS QUE SOLO LE PERTENECEN A UN NEGOCIO EN ESPECIFICO*/
router.get('/getAllProductNegocio/:estado?', verificarTokenNegocio , construccionController.getAllProductNegocio);
/*RECUPERACION DE TODOS LOS PRODUCTOS DE TODOS LOS NEGOCIOS */
router.get('/getAllProduct', construccionController.getAllProducto);
/*BUSQUEDA DEL PRODUCTO SEGUN SEA SU NOMBRE O SI SE DESEA BUSCAR POR ID*/
router.get('/searchproduct/:_id' , construccionController.searchproductId);
/*BUSQUEDA DEL PRODUCTO POR NOMBRE*/
router.get('/searchproductName/:nombre' ,verificarTokenNegocio, construccionController.searchproductName);
/*DEVUELVE LA CANTIDAD DE PRODUCTOS EXISTENTES*/
router.get('/countProduct' ,verificarTokenNegocio, construccionController.countProductNegocio);
//ACTUALIZACION DEL PRODUCTO POR ID DEL NEGOCIO AL QUE PERTENECE Y SU PROPIO ID
router.put('/update-data/:_id', verificarTokenNegocio , construccionController.updateDatos);
//ELIMINACION DEL PRODUCTO POR _ID DEL NEGOCIO E _ID DEL PRODUCTO
router.delete('/delete-data/:_id', verificarTokenNegocio , construccionController.deleteProduct);
//ACTUALIZACION DEL ESTADO DEL PRODUCTO POR _IDNEGOCIO , _IDPRODUCTO, ESTADO (FALSE,  TRUE )  
router.put('/update-status', verificarTokenNegocio , construccionController.updateStatus);
/*SUBIDA DE LA IMAGEN DEL PRODUCTO */
router.post('/upload-imagen/:_id',[ verificarTokenNegocio , upload.single('file') ]  , construccionController.uploadImage);
/*ACTUALIZAR IMAGEN  IDPRODUCTO , ID de la imagen*/
router.put('/updateImage',[ verificarTokenNegocio , upload.single('file') ] , construccionController.actualizarImage );
/*OBTENER IMAGEN POR NOMBRE , ID DEL PRODUCTO =>QUERY , ID DE LA IMAGEN =>QUERY*/
router.get('/get-img/:nameImage' ,verificarTokenNegocio, construccionController.getImage);
/*ELIMINAR IMAGEN DEL PRODUCTO*/
router.delete('/delete-img/:nameImage' ,verificarTokenNegocio, construccionController.deleteImageProduct);
/*ELIMINAR TODAS LAS IMAGENES DE LA CARPETA ABARROTE Y ELINAMOS LA LISTA DE DATOS EN MONGODB*/
router.delete('/delete-all-image' ,verificarTokenNegocio, construccionController.deleteAllImageProduct);
/*AUMENTAR LA CANTIDAD DE VISTA SOBRE EL PRODUCTO */
router.put('/aumentar-vista' ,construccionController.aumentarVistas );

module.exports = router;