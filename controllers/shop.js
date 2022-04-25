const Product = require('../modules/product');
const Order = require('../modules/order');
const stripe = require('stripe')('sk_test_51KhAUPSDZQP3LR9L0t4sihh6eriy3T2DLZhGuSKoma6QyDVI5sIkUilweCaVHyXzz5zEvhD05lNfs4QM8Fwx92J300INm9WrEW');

const items_on_page = 2;
let totalItems;

exports.getProducts = (req, res, next) => {
    const page = +req.query.page || 1;
    Product.find().countDocuments().then(numProduct => {
        totalItems = numProduct
        return Product.find()
            .skip((page - 1) * items_on_page)
            .limit(items_on_page)
    })
        .then(products => {
            res.render('shop/product-list', {
                prods: products,
                pageTitle: 'Products',
                path: '/',
                currentPage: page,
                hasNextPage: items_on_page * page < totalItems,
                hasPrevious: page > 1,
                nextPage: page + 1,
                previousPage: page - 1,
                lastPage: Math.ceil(totalItems / items_on_page)
            });
        }).catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
};

exports.getProduct = (req, res, next) => {
    const prodId = req.params.productID;

    Product.findById(prodId)
        .then(product => {
            res.render(
                'shop/product-detail',
                {
                    product: product,
                    pageTitle: product.title,
                    path: '/products',
                });
        })
        .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });

    // fetch the data from database using findByPk()

    // Product.findByPk(prodId).then(product => {
    //     res.render(
    //         'shop/product-detail',
    //         {
    //             product: product,
    //             pageTitle: product.title,
    //             path: '/products'
    //         })
    // }).catch(err => console.log(err))
};

exports.getIndex = (req, res, next) => {
    const page = +req.query.page || 1;
    Product.find().countDocuments().then(numProduct => {
        totalItems = numProduct
        return Product.find()
            .skip((page - 1) * items_on_page)
            .limit(items_on_page)
    })
        .then(products => {
            res.render('shop/index', {
                prods: products,
                pageTitle: 'Shop',
                path: '/',
                currentPage: page,
                hasNextPage: items_on_page * page < totalItems,
                hasPrevious: page > 1,
                nextPage: page + 1,
                previousPage: page - 1,
                lastPage: Math.ceil(totalItems / items_on_page)
            });
        }).catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
};

exports.getCart = (req, res, next) => {
    req.user
        .populate(['cart.items.productID'])
        .then(user => {
            // console.log("clg 1" + user.cart.items);
            // console.log("clg 1" + req.session.isLoggedIn);
            const products = user.cart.items;
            res.render('shop/cart', {
                path: '/cart',
                pageTitle: 'Your Cart',
                products: products,
            })

        }).catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
};

// Cart.getCart(cart => {
//     Product.fetchAll(products => {
//         const cartProducts = []
//         for (products of products) {
//             const cartProductData = cart.products.find(prod => prod.id === products.id)
//             if (cartProductData) {
//                 cartProducts.push({ productData: products, qty: cartProductData.qty });
//             }
//         }
//         res.render('shop/cart', {
//             path: '/cart',
//             pageTitle: 'Your Cart',
//             products: cartProducts
//         });
//     });
// });



// exports.postCart = (req, res, next) => {
//     Product.findById(prodId, (product) => {
//         console.log(product);
//         Cart.addProduct(prodId, product.price);
//     });
//     res.redirect('/cart');
// }

exports.postCart = (req, res, next) => {
    const prodId = req.body.productID;
    Product.findById(prodId)
        .then(product => {
            return req.user.addToCart(product);
        }).then(result => {
            // console.log(result);
            res.redirect('/cart');
        });
};

exports.postCartDelete = (req, res, next) => {
    const prodId = req.body.productID;
    req.user.getCart()
        .then(cart => {
            return cart.getProducts({ where: { id: prodId } })
        }).then(products => {
            const product = products[0];
            return product.cartitems.destroy();
        }).then(result => {
            res.redirect('/cart');
        })
        .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
};

exports.postCartDeleteProduct = (req, res, next) => {
    const prodId = req.body.productID;
    req.user.removeFromCart(prodId)
        .then(result => {
            res.redirect('/cart');
        })
        .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
};


exports.getCheckout = (req, res, next) => {
    let products;
    let total = 0;
    req.user
        .populate(['cart.items.productID'])
        .then(user => {
            const products = user.cart.items;
            let total = 0;
            products.forEach(p => {
                total += p.qty * p.productID.price;
            });

            return stripe.checkout.sessions.create({
                payment_method_types: ['card'],
                line_itmes: products.map(p => {
                    return {
                        name: p.productID.title,
                        description: p.productID.descrip,
                        amount: p.productID.price * 100,
                        currency: 'usd',
                        quantity: p.qty
                    };
                }),
                success_url: req.protocol + '://' + req.get('host') + '/checkout/success',
                cancel_url: req.protocol + '://' + req.get('host') + '/checkout/cancel',
            });
        }).then(session => {
            res.render('shop/checkout', {
                path: '/checkout',
                pageTitle: 'Checkout',
                products: products,
                totalsum: total,
                seesionId: session.id
            })
        }).catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
};


exports.getCheckoutSuccess = (req, res, next) => {
    req.user.populate(['cart.items.productID'])
        .then(user => {
            // console.log(user.cart.items);
            const products = user.cart.items.map(i => {
                return { qty: i.qty, product: { ...i.productID._doc } }
            });
            const order = new Order({
                user: {
                    email: req.user.email,
                    userId: req.user
                },
                products: products
            });
            return order.save()
        })
        .then(result => {
            return req.user.clearCart()
        }).then(() => {
            res.redirect('/orders');
        })
        .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
}

exports.postOrder = (req, res, next) => {
    req.user.populate(['cart.items.productID'])
        .then(user => {
            // console.log(user.cart.items);
            const products = user.cart.items.map(i => {
                return { qty: i.qty, product: { ...i.productID._doc } }
            });
            const order = new Order({
                user: {
                    email: req.user.email,
                    userId: req.user
                },
                products: products
            });
            return order.save()
        })
        .then(result => {
            return req.user.clearCart()
        }).then(() => {
            res.redirect('/orders');
        })
        .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
}


exports.getOrders = (req, res, next) => {
    // console.log(req.session.isLoggedIn);
    Order.find({ "user.userId": req.user._id })
        .then(orders => {
            res.render('shop/orders', {
                path: '/orders',
                pageTitle: 'Your Orders',
                orders: orders,
            });
        })
        .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
};