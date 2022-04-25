const express = require('express');
const router = express.Router();
const auth_controller = require('../controllers/auth');
const { check, body } = require('express-validator/check');
const User = require('../modules/user');

router.get('/login', auth_controller.getLogin);

router.post('/login', [
    body('email').isEmail().normalizeEmail().withMessage('Please enter Email and password for login'),
    body('pwd').isLength({ min: 3 }).trim()
], auth_controller.postLogin);

router.post('/logout', auth_controller.postLogout);

router.get('/signup', auth_controller.getSignup);

router.post('/signup',

    [check('email').isEmail().withMessage('Please enter valid email Id').custom((value, { req }) => {
        return User.findOne({ email: value })
            .then(userData => {
                if (userData) {
                    return Promise.reject('Email is already exists, please login or try different one!');
                }
            })
    })
        .normalizeEmail(),

    body('pwd').isLength({ min: 8 }).trim().withMessage('Password must be 8 character'),

    body('cpwd').trim().custom((value, { req }) => {
        if (value !== req.body.pwd) {
            throw new Error(`password didn't match!`)
        }
        return true;
    })

    ],

    auth_controller.postSignup);

router.get('/reset', auth_controller.getReset);

router.post('/reset', auth_controller.postReset);

router.get('/reset/:token', auth_controller.getNewPassword);

router.post('/newpassword', auth_controller.postNewPassword);



module.exports = router;