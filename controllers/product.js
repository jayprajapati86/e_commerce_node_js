const { validationResult } = require('express-validator/check')
const Product = require('../modules/product');
const mongoose = require('mongoose');

exports.getAddProduct = (req, res, next) => {
    if (!req.session.isLoggedIn) {
        return res.redirect('/login')
    }
    res.render('admin/edit_product',
        {
            pageTitle: 'Add product',
            path: '/admin/add_product',
            editing: false,
            hasError: false,
            errorMessage: null,
            validationError: []
        }
    )
}

exports.postAddproduct = (req, res, next) => {
    const title = req.body.title;
    const img_url = req.body.img_url;
    const descrip = req.body.descrip;
    const price = req.body.price;
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(422).render('admin/edit_product',
            {
                pageTitle: 'Add product',
                path: '/admin/add_product',
                editing: false,
                hasError: true,
                product: {
                    title: title,
                    img_url: img_url,
                    descrip: descrip,
                    price: price
                },
                errorMessage: errors.array()[0].msg,
                validationError: errors.array()
            });
    }
    const product = new Product({

        _id: new mongoose.Types.ObjectId(), title: title, img_url: img_url, descrip: descrip, price: price, userId: req.user

    });
    product.save().then(result => {
        res.redirect('/')
    }).catch(err => {
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
    });
};

exports.geteditProduct = (req, res, next) => {

    const prodId = req.params.productID;
    Product.findById(prodId)
        .then(product => {
            if (!product) {
                return res.redirect('/');
            }
            res.render('admin/edit_product',
                {
                    pageTitle: 'edit product',
                    path: '/admin/edit_product',
                    editing: true,
                    product: product,
                    hasError: false,
                    errorMessage: null,
                    validationError: []
                });
        }).catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        })
};

exports.posteditProduct = (req, res, next) => {
    const prodId = req.body.productID;
    const updatedTitle = req.body.title;
    const updatedimg = req.body.img_url;
    const updateedDescip = req.body.descrip;
    const updatedPrice = req.body.price;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).render('admin/edit_product',
            {
                pageTitle: 'Edit product',
                path: '/admin/edit_product',
                editing: true,
                hasError: true,
                product: {
                    title: updatedTitle,
                    descrip: updateedDescip,
                    price: updatedPrice,
                    _id: prodId
                },
                errorMessage: errors.array()[0].msg,
                validationError: errors.array()
            });
    }

    Product.findById(prodId)
        .then(product => {

            if (product.userId.toString() !== req.user._id.toString()) {
                return res.redirect('/')
            }
            product.title = updatedTitle;
            product.img_url = updatedimg;
            product.descrip = updateedDescip;
            product.price = updatedPrice
            return product.save()
                .then(result => {
                    console.log('Product detail is UPDATED!');
                    res.redirect('/products')
                })

        })
        .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });

};

exports.getProduct = (req, res, next) => {
    Product.find({ userId: req.user._id })
        .then(products => {
            res.render('admin/products', {
                prods: products,
                pageTitle: 'Admin Products',
                path: '/admin/products',
            });
        }).catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
};

exports.deleteProduct = (req, res, next) => {
    const prodId = req.params.productID;
    Product.deleteOne({ _id: prodId, userId: req.user._id })
        .then(() => {
            console.log('product has been DELETED');
            res.status(200).json({ message: "Deleted Product!" });
        })
        .catch(err => {
            res.status(500).json({ message: "Deleted Product Failed!" });
        });
};
