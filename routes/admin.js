const path = require('path');
const express = require('express');
const router = express.Router();
const product_Controller = require('../controllers/product');
const { body } = require('express-validator/check')

const isAuth = require('../middleware/is-auth');

// // will GET -->
router.get('/add_product', isAuth, product_Controller.getAddProduct);

router.get('/product', isAuth, product_Controller.getProduct);

// // Will POST -->
router.post('/add_product', [

    body('title').isString().isLength({ min: 2 }).trim(),
    body('img_url').isURL().withMessage('please enter the image URL!'),
    body('price').isFloat(),
    body('descrip').isLength({ min: 8, max: 400 }).trim()
], isAuth, product_Controller.postAddproduct);

router.get('/edit-product/:productID', isAuth, product_Controller.geteditProduct);

router.post('/edit-product', [
    body('title').isString().isLength({ min: 2 }).trim(),
    body('img_url').isURL().withMessage('please enter the image URL!'),
    body('price').isFloat(),
    body('descrip').isLength({ min: 8, max: 400 }).trim()
], isAuth, product_Controller.posteditProduct);


router.delete('/product/:productID', isAuth, product_Controller.deleteProduct);


module.exports = router;