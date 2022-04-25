const path = require('path');
const express = require('express');

const shop_Controller = require('../controllers/shop');

const isAuth = require('../middleware/is-auth');

const router = express.Router();

router.get('/', shop_Controller.getIndex);

// router.get('/', shop_Controller.getIndex);

router.get('/products', shop_Controller.getProducts);

router.get('/products/:productID', shop_Controller.getProduct);

router.get('/cart', isAuth, shop_Controller.getCart);

router.post('/cart', isAuth, shop_Controller.postCart);

router.post('/cart-delete-item', isAuth, shop_Controller.postCartDeleteProduct);

// router.post('/create-order', isAuth, shop_Controller.postOrder);

router.get('/checkout', isAuth, shop_Controller.getCheckout);

router.get('/checkout/success', shop_Controller.getCheckoutSuccess);

router.get('/checkout/cancel', shop_Controller.getCheckout);

router.get('/orders', isAuth, shop_Controller.getOrders);

module.exports = router;
