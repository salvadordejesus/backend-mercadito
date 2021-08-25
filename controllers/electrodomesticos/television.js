'use strict'
const mongoose = require('mongoose');
const Validator = require('validator');
const Negocio = require('../../models/negocio');
var fs = require('fs');//PARA ELIMINAR ARCHIVOS
var path = require('path'); //PARA OBTENER LAS RUTAS DE LAS CARPETAS

var controller = {

    saveData: (req, res) => {
        //DATOS QUE VIENEN POR POST
        var body = req.body;
        var _idNegocio = req.negocio_autentificado._id;
       
        const _idproducto = new mongoose.Types.ObjectId();
        var datos_producto = {
            _id: _idproducto,
            nombre: body.nombre.toUpperCase(),
            descripcion: body.descripcion,
            pantalla: body.pantalla,
            puertos: body.puertos,
            marca: body.marca,
            anio_modelo: body.anio_modelo,
            medidas: body.medidas,
            pulgadas: body.pulgadas,
            v_t: body.v_t,
            garantia: body.garantia,
            altavoces: body.altavoces,
            pantalla_curva: body.pantalla_curva,
            otra_inf: body.otra_inf,
            existencia: body.existencia,
            precio: body.precio,
            precio_anterior: body.precio_anterior,
            fecha_inicio: body.fecha_inicio,
            fecha_fin: body.fecha_fin
        };

        var result = agregaProducto(_idNegocio, datos_producto);
        result.then(producUp => {

            return res.status(400).send({
                status: "success",
                message: _idproducto
            });

        }).catch(err => {
            return res.status(400).send({
                status: "error",
                message: err
            });
        });
    },
    getAllProductNegocio: (req, res) => {

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
                message: "Usuario no identificadod"
            });
        }

        var _idNegocio = req.negocio_autentificado._id;
        var estadoProducto = req.params.estado;

        var listaProductoEncontrados = [];

        Negocio.find({ _id: _idNegocio }).
            and({ estado: true }).
            select({ television: 1, _id: 1 }).
            exec((err, listProducto) => {

                if (err) {
                    return res.status(200).send({
                        status: "error",
                        message: "Producto no encontrado"
                    });
                }

                listProducto.forEach((productos, index, data) => {

                    productos['television'].forEach((producto, index, data) => {

                        let estado_recuperado = producto['estado'];

                        //PRODUCTO ACTIVADO
                        if (estado_recuperado == estadoProducto) {
                            listaProductoEncontrados.push(producto);
                        }
                    }
                    );
                });

                if (listaProductoEncontrados.length == 0) {
                    return res.status(200).send({
                        status: "vacio",
                        message: "Producto no encontrado"
                    });
                }

                //ORDENAMIENTO DE DATOS POR PRECIO MENOR A MAYOR
                listaProductoEncontrados.sort((a, b) => {
                    var textA = a.precio;
                    var textB = b.precio;
                    return (textA < textB) ? -1 : (textA > textB) ? 1 : 0;
                });

                return res.status(200).send({
                    status: "success",
                    message: listaProductoEncontrados
                });

            });

    },
    getAllProducto: (req, res) => {

        Negocio.find().
            and([{ estado: true }, { "television.estado": true }]).
            select({ television: 1, _id: 1 }).
            sort({ "television.precio": 1 }).
            exec((err, listProducto) => {

                if (err) {
                    return res.status(200).send({
                        status: "Error",
                        message: "Producto no encontrado!!!"
                    });
                }

                if (listProducto.length == 0) {
                    return res.status(200).send({
                        status: "No encontrado",
                        message: "Producto no encontrado!!!"
                    });
                }

                return res.status(200).send({
                    status: "success",
                    message: listProducto

                });
            });
    },

    searchproductId: (req, res) => {
        if (req.params._id) { //BUSQUEDAD POR ID
            //FUNCIONA

            Negocio.findOne({ "television._id": req.params._id }, { "television.$": 1 }).exec((err, listProducto) => {

                if (err) {
                    return res.status(500).send({
                        status: "error",
                        message: "Producto no encontrado " + err
                    });
                }

                if (listProducto.length == 0) {
                    return res.status(404).send({
                        status: "No encontrado",
                        message: "Producto no encontrado"
                    });
                }

                return res.status(200).send({
                    status: "success",
                    message: listProducto
                });
            });
        }
    },
    searchproductName: (req, res) => {

        var queryMongo;
        var nombrebody = req.params.nombre;
        var _idNegocio = req.negocio_autentificado._id;

        queryMongo = Negocio.find({
            _id: _idNegocio,
            "$or": [
                { "television.nombre": { "$regex": nombrebody, "$options": "i" } },
                { "television.descripcion": { "$regex": nombrebody, "$options": "i" } }
            ]
        });

        var listaProductoEncontrados = [];
        queryMongo.
            and([{ estado: true }, { "television.estado": true }]).
            select({ television: 1, _id: 1 }).
            sort({ "television.precio": 1 }).
            exec((err, televisiones) => {

                if (err) {
                    return res.status(500).send({
                        status: "error",
                        message: "Producto no encontrado"
                    });
                }

                if (televisiones.length == 0) {
                    return res.status(200).send({
                        status: "vacio",
                        message: "Producto no encontrado"
                    });
                }

                televisiones.forEach((television, index, data) => {

                    television['television'].forEach((producto, index, data) => {

                        let er = new RegExp(nombrebody, 'i')
                        if (er.test(producto.nombre)) {

                            listaProductoEncontrados.push(producto);

                        }
                    });
                }
                );

                return res.status(200).send({
                    status: "success",
                    message: listaProductoEncontrados
                });

            });
    },
    countProductNegocio: (req, res) => {

        var queryMongo;
        var _idNegocio = req.negocio_autentificado._id;

        queryMongo = Negocio.find({ _id: _idNegocio });

        queryMongo.
            select({ television: 1 }).
            and([{ estado: true }]).
            exec((err, televisiones) => {

                if (err) {
                    return res.status(500).send({
                        status: "error",
                        message: "Producto no encontrado"
                    });
                }

                if (televisiones[0].television.length == 0 || televisiones[0].television.length == null) {
                    return res.status(200).send({
                        status: "success",
                        message: 0
                    });
                }

                return res.status(200).send({
                    status: "success",
                    message: televisiones[0].television.length
                });

            });
    },
    updateDatos: (req, res) => {

        try {
            if (typeof req.negocio_autentificado._id === 'undefined') {
                return res.status(400).send({
                    status: "error",
                    message: "Usuario no identificado"
                });

            }
        } catch (error) {
            return res.status(400).send({
                status: "error",
                message: "Usuario no identificadod"
            });
        }

        var _id_negocio = req.negocio_autentificado._id;
        //RECOGEMOS DATOS POR POST
        var _id_producto = req.params._id;
        var body = req.body;
       
        var datos_producto = {
            _id:body._id,
            imagen: body.imagen,
            nombre: body.nombre,
            descripcion: body.descripcion,
            pantalla: body.pantalla,
            puertos: body.puertos,
            marca: body.marca,
            anio_modelo: body.anio_modelo,
            medidas: body.medidas,
            pulgadas: body.pulgadas,
            v_t: body.v_t,
            garantia: body.garantia,
            altavoces: body.altavoces,
            pantalla_curva: body.pantalla_curva,
            otra_inf: body.otra_inf,
            precio: body.precio,
            existencia: body.existencia
        };

        let resultUpdate = actualizarProducto(_id_negocio, _id_producto, datos_producto);

        resultUpdate.then(productUpdate => {
            if (!productUpdate) {
                return res.status(400).send({
                    status: "Error",
                    message: "Error al actualizar el producto"
                });
            }

            return res.status(400).send({
                status: "success",
                message: productUpdate
            });

        }).catch(err => {
            return res.status(400).send({
                status: "Error",
                message: err
            });
        });
    },

    deleteProduct: (req, res) => {

        var _id_negocio = req.negocio_autentificado._id;
        //RECOGEN DATOS POR POST
        var _id_producto = req.params._id;

        let resultRemoved = eliminarProducto(_id_negocio, _id_producto);

        resultRemoved.then(productRevomed => {
            if (!productRevomed) {
                return res.status(400).send({
                    status: "Error",
                    message: "Error al eliminar el producto"
                });
            }

            return res.status(400).send({
                status: "success",
                message: productRevomed
            });
        }).catch(err => {
            return res.status(400).send({
                status: "Error",
                message: err
            });
        });
    },
    updateStatus: (req, res) => {

        var _id_negocio = req.negocio_autentificado._id;

        var _id_producto = req.query._idproducto;
        var estado = req.query.estado;


        //VALIDACION DE DATOS
        try {

            var validate_idproducto = !Validator.isEmpty(_id_producto);

            if (!validate_idproducto) {

                return res.status(400).send({
                    status: "error",
                    message: "Id del producto incorrecto"
                });
            }

            var validate_estado = !Validator.isEmpty(estado);

            if (!validate_estado) {

                return res.status(400).send({
                    status: "error",
                    message: "Estado incorrecto"
                });
            }

        } catch (error) {
            return res.status(200).send({
                status: "error",
                message: "Faltan datos por enviar"
            });
        }

        let resultUpdate = updateStatusProduct(_id_negocio, _id_producto, estado);

        resultUpdate.then(productUpdate => {

            if (!productUpdate) {
                return res.status(400).send({
                    status: "Error",
                    message: "Error al actualizar el producto"
                });
            }

            return res.status(400).send({
                status: "success",
                message: productUpdate
            });
        }).catch(err => {
            return res.status(400).send({
                status: "Error",
                message: err
            });
        });
    },
    actualizarImage: (req, res) => {
        //ACTUALIZACION DE IMAGEN
        try {
            if (typeof req.negocio_autentificado._id === 'undefined') {
                return res.status(400).send({
                    status: "error",
                    message: "Usuario no identificado"
                });
            }
        } catch (error) {
            return res.status(400).send({
                status: "error",
                message: "Usuario no identificadod"
            });
        }

        var _idNegocio = req.negocio_autentificado._id;
        var file_name = 'Imagen no subido';

        if (!req.file) {
            return res.status(404).send({
                status: 'error',
                message: file_name
            });
        }

        var file_path = req.file.path;

        var file_split = file_path.split('\\');

        //Advertencia En linux o mac
        //var file_split = file_path.split(/);
        var file_name = file_split[3];
        //console.log('file_name: ' + file_name);

        //EXTENSIÓN DEL ARCHIVO
        var ext_split = file_name.split('.');
        //console.log('ext_split ' + ext_split);

        var file_ext = ext_split[1];
        //console.log('file_ext ' + file_ext);

        //COMPROBAR EXTENSION (SOLO IMAGENES), SI ES VALIDA BORRAR EL FICHERO
        if (file_ext != 'png' && file_ext != 'jpg' && file_ext != 'jpeg') {
            //BORRAR EL ARCHIVO SUBIDO
            let rutaArchivoEliminar = './uploads/' + _idNegocio + '/television/' + file_name;

            fs.exists(rutaArchivoEliminar, (exists) => {

                if (exists) {

                    fs.unlink(rutaArchivoEliminar, (err) => {
                        if (err) {
                            return res.status(200).send({
                                status: 'error',
                                message: "La extensión de la imagen no es válida"
                            });
                        }
                    });

                } else {
                    return res.status(200).send({
                        status: 'error',
                        message: "La extensión de la imagen no es válida"
                    });
                }
            });

        } else {

            var _idProducto = req.query._idProducto;
            var _idImage = req.query._idImage;

            Negocio.findOne(
                { "_id": _idNegocio },
                { "television._id": _idProducto },
                { 'television.imagen._id': _idImage }).
                select({ 'television.imagen': 1 }).
                exec((err, resultquery) => {

                    if (err) {
                        return res.status(404).send({
                            status: 'error',
                            message: 'Error al buscar la imagen'
                        });
                    }

                    if (resultquery) {

                        resultquery["television"].forEach((lista_image, index, data) => {

                            lista_image["imagen"].forEach((datos, index, data) => {

                                if (datos['_id'] == _idImage) {

                                    //ELIMINACION DEL ARCHIVO SUBIDO ANTERIORMENTE
                                    var rutaArchivo = './uploads/' + _idNegocio + '/television/' + datos['ruta'];

                                    fs.exists(rutaArchivo, (exists) => {

                                        if (exists) {
                                            //BORRAR EL ARCHIVO SUBIDO
                                            fs.unlink(rutaArchivo, (err) => {

                                                if (err) {
                                                    return res.status(200).send({
                                                        status: 'error',
                                                        message: "La extensión de la imagen no es válida"
                                                    });
                                                }
                                            });
                                        }
                                    });
                                }
                            });
                        });
                    }
                });


            let resultUpdate = actualizarImagen(_idNegocio, _idProducto, _idImage, file_name);

            resultUpdate.then(productUpdate => {

                if (!productUpdate) {
                    return res.status(400).send({
                        status: "Error",
                        message: "Error al actualizar el producto"
                    });
                }

                return res.status(400).send({
                    status: "success",
                    message: productUpdate
                });

            }).catch(err => {
                return res.status(400).send({
                    status: "Error",
                    message: err
                });
            });
        }
    },
    uploadImage: (req, res) => {
        //SUBIDA DE IMAGENES

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

        console.log(req.file.path);

        var file_name = 'Imagen no subido';

        if (!req.file) {
            return res.status(404).send({
                status: 'vacio',
                message: file_name
            });
        }

        var file_path = req.file.path;

        var file_split = file_path.split('\\');

        //Advertencia En linux o mac
        //var file_split = file_path.split(/);
        var file_name = file_split[3];

        //EXTENSIÓN DEL ARCHIVO
        var ext_split = file_name.split('.');

        var file_ext = ext_split[1];

        //COMPROBAR EXTENSION (SOLO IMAGENES), SI ES VALIDA BORRAR EL FICHERO
        if (file_ext != 'png' && file_ext != 'jpg' && file_ext != 'jpeg') {
            //BORRAR EL ARCHIVO SUBIDO
            fs.unlink(file_path, (err) => {
                if (err) {
                    return res.status(500).send({
                        status: 'error',
                        message: "La extension de la imagen no es válida " + err
                    });
                }
            });

        } else {
            if (req.params._id) {
                
                var _idNegocio = req.negocio_autentificado._id;
                var _idProducto = req.params._id;
                var result = agregarImagen(_idNegocio, _idProducto, file_name);

                result.then(producUp => {
                    return res.status(200).send({
                        status: "success",
                        message: producUp
                    });
                }).catch(err => {
                    return res.status(500).send({
                        status: "error",
                        message: err
                    });
                });

            } else {
                return res.status(200).send({
                    status: "success",
                    message: file_name
                }); s
            }
        }
    },
    getImage: (req, res) => {
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
                message: "Usuario no identificadod"
            });
        }

        var _idNegocio = req.negocio_autentificado._id;
        var nameImage = req.params.nameImage;
        var path_file = './uploads/' + _idNegocio + '/television/' + nameImage;

        fs.exists(path_file, (exists) => {

            if (exists) {
                return res.sendFile(path.resolve(path_file));
            } else {
                return res.status(404).send({
                    status: 'error',
                    message: 'La imagen no existe!!'
                });
            }
        });
    },
    deleteImageProduct: (req, res) => {
        //AUTENTIFICAR USUARIO
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
                message: "Usuario no identificadod"
            });
        }

        const _idNegocio = req.negocio_autentificado._id;
       
        const _nameImage = req.params.nameImage;

        console.log("name imagen",_nameImage);

        //RUTA DEL ARCHIVO A ELIMINAR
        const rutaArchivoEliminar = './uploads/' + _idNegocio + '/television/' + _nameImage;

        fs.exists(rutaArchivoEliminar, (exists) => {

            if (exists) {
                fs.unlink(rutaArchivoEliminar, (err) => {
                    
                    if (err) {
                        return res.status(500).send({
                            status: 'error',
                            message: "Error al eliminar el archivo"
                        });
                    }

                    return res.status(200).send({
                        status: 'success',
                        message: "Archivo eliminado correctamente"
                    });
                });

            } else {
                return res.status(404).send({
                    status: 'error',
                    message: "No existe el archivo"
                });
            }
        });
    },
    deleteAllImageProduct: (req, res) => {

        const _idnegocio = req.negocio_autentificado._id;
        const rutaArchivoEliminar = '../../uploads/' + _idnegocio + '/television';

        //SE ELIMINA LAS IMAGENES
        let pathJoin = path.join(__dirname, rutaArchivoEliminar);

        eliminarFolderNegocio(pathJoin).then(respuestaEliminacion => {

            if (respuestaEliminacion == "DIRECTORIO_ELIMINADO") {
                console.log(respuestaEliminacion);
            } else {
                return res.status(500).send(
                    {
                        status: "error",
                        message: "Hubo un problema con el servidor"
                    }
                );
            }
        });

        //SE ELIMINA LA LISTA DE DATOS EN EN ARRAY
        let resultUpdate = borrarListaProducto(_idnegocio);
        resultUpdate.then(productUpdate => {
            if (!productUpdate) {
                return res.status(404).send({
                    status: "error",
                    message: "Error al actualizar el producto"
                });
            }

            return res.status(200).send({
                status: "success",
                message: productUpdate
            });

        }).catch(err => {
            return res.status(500).send({
                status: "error",
                message: err
            });
        });
    },
    
    aumentarVistas: (req, res) => {

        let _idNegocio = req.query._idnegocio;
        let _idproducto = req.query._idproducto

        let update = incrementarVista(_idNegocio, _idproducto);
        update.then(updateVist => {

            return res.status(404).send({
                status: "success",
                message: updateVist
            });

        }).catch(error => {

            return res.status(404).send({
                status: "error",
                message: error
            });

        });
    }
};

/**
 * ELIMINA UN PRODUCTO QUE PERTENECE A LA COLECCION DE NEGOCIO
 * @param {*} _id_negocio _id DEL NEGOCIO AL QUE PERTENECE EL PRODUCTO
 * @param {*} _id_producto _id DEL PRODUCTO
 */
async function eliminarProducto(_id_negocio, _id_producto) {

    let productUpdate = await Negocio.update({ '_id': _id_negocio },
        {
            $pull: {

                television: { _id: { $eq: _id_producto } }
            }
        }
    );

    return productUpdate;
}

/**
 * ACTUALIZAR EL ESTADO DEL PRODUCTO A TRUE O FALSE
 * @param {*} _id_negocio _id DEL NEGOCIO AL QUE PERTENECE EL PRODUCTO
 * @param {*} _id_producto _id DEL PRODUCTO
 * @param {*} status ESTADO FALSE O TRUE
 */
async function updateStatusProduct(_id_negocio, _id_producto, status) {


    let productUpdate = await Negocio.updateOne({ '_id': _id_negocio },
        {
            $set: {
                'television.$[prod].estado': status
            }
        },
        {
            arrayFilters: [{ "prod._id": { $eq: _id_producto } }]
        });

    return productUpdate;
}

async function incrementarVista(_id_negocio, _id_producto) {
    let productUpdate = await Negocio.updateOne({ '_id': _id_negocio },
        {
            $inc: {
                'television.$[prod].vistas': 1
            }
        },
        {
            arrayFilters: [{ "prod._id": { $eq: _id_producto } }]
        });

    return productUpdate;
}

/**
 * ACTUALIZA LOS DATOS DEL PRODUCTO 
 * @param {*} _id_negocio _id DEL NEGOCIO AL QUE PERTENECE EL PRODUCTO
 * @param {*} _id_producto _id DEL PRODUCTO
 * @param {*} datos_producto DATOS DEL PRODUCTO EN JSON
 */
async function actualizarProducto(_id_negocio, _id_producto, datos_producto) {

    let productUpdate = await Negocio.updateOne({ '_id': _id_negocio },
        {
            $set: {
                'television.$[prod]': datos_producto
            }
        },
        {
            arrayFilters: [{ "prod._id": { $eq: _id_producto } }]
        });

    return productUpdate;
}

/**
 * GUARDA UN PRODUCTO EN LA COLECCION DE NEGOCIO DENTRO DE UN ARRAY
 * @param {*} _idNegocio _id DEL NEGOCIO AL QUE PERTENECE EL PRODUCTO
 * @param {*} datos_producto DATOS DEL PRODUCTO EN JSON
 */
async function agregaProducto(_idNegocio, datos_producto) {

    let productInsert = await Negocio.updateOne({ _id: _idNegocio }, {
        $push: {
            'television': datos_producto
        }
    }, { new: true });

    return productInsert;
}

async function agregarImagen(_idNegocio, _idProducto, rutaImage) {

    let productUpdate = await Negocio.updateOne({
        "_id": _idNegocio,
        "television._id": _idProducto
    }, {
        "$push":
            { "television.$.imagen": { "ruta": rutaImage } }
    });

    return productUpdate;
}

async function actualizarImagen(_idNegocio, _idProducto, _id_image, rutaImage) {
    let productUpdate = await Negocio.updateOne(
        { "_id": { $eq: _idNegocio } },
        { $set: { "television.$[prod].imagen.$[img].ruta": rutaImage } },
        {
            arrayFilters: [
                { "prod._id": { $eq: _idProducto } },
                { "img._id": { $eq: _id_image } }
            ]
        });

    return productUpdate;
}


//================================================================================
function deleteFolder(path) {
    //SE CREA UNA PROMESA
    return new Promise(resolve => {
        //SE RESUELVE EL PROBLEMA
        let files = [];
        if (fs.existsSync(path)) {

            files = fs.readdirSync(path);
            files.forEach(function (file, index) {

                let curPath = path + "/" + file;

                fs.unlinkSync(curPath);
            });
            
            resolve("DIRECTORIO_ELIMINADO");
        } else {
            //DEVOLVEMOS UNA RESPUESTA
            resolve("EL_DIRECTORIO_NO_EXISTE");
        }
    });
}

//CREAMOS UNA FUNCION ASINCRONA
async function eliminarFolderNegocio(path) {
    //USAMOS LA FUNCION 
    const respuesta = await deleteFolder(path);
    return respuesta;
}

/**
 * ACTUALIZAMOS EL ARRAY A UNA MATRIZ VACIO
 * @param {*} _id_negocio _id DEL NEGOCIO AL QUE PERTENECE EL PRODUCTO
 */
async function borrarListaProducto(_id_negocio) {

    let productUpdate = await Negocio.updateOne({ '_id': _id_negocio },
        {
            $set: {
                'television': []
            }
        }
    );

    return productUpdate;
}

module.exports = controller;