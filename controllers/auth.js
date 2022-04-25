const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const User = require('../modules/user');
const nodemailer = require('nodemailer');
const { validationResult } = require('express-validator/check');

exports.getLogin = (req, res, next) => {
    let message = req.flash('error');
    if (message.length > 0) {
        message = message[0];
    } else {
        message = null;
    }
    res.render('auth/login', {
        path: '/login',
        pageTitle: 'Login Page',
        errorMessage: message,
        oldInput: { email: "", pwd: '', cpwd: '' },
        validationError: []
    });
};

exports.postLogin = (req, res, next) => {
    const email = req.body.email;
    const pwd = req.body.pwd;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.render('auth/login', {
            path: '/login',
            pageTitle: 'Login Page',
            errorMessage: errors.array()[0].msg,
            oldInput: { email: email, pwd: pwd },
            validationError: errors.array()
        });
    }

    User.findOne({ email: email })
        .then(user => {
            if (!user) {
                return res.render('auth/login', {
                    path: '/login',
                    pageTitle: 'Login Page',
                    errorMessage: 'Invalid Email!',
                    oldInput: { email: email, pwd: pwd, cpwd: req.body.cpwd },
                    validationError: errors.array()
                });
            }
            bcrypt.compare(pwd, user.pwd)
                .then(doMatch => {
                    if (doMatch) {
                        req.session.isLoggedIn = true;
                        req.session.user = user;
                        return req.session.save(err => {

                            res.redirect('/');
                        });
                    }
                    return res.render('auth/login', {
                        path: '/login',
                        pageTitle: 'Login Page',
                        errorMessage: 'Invalid Password!',
                        oldInput: { email: email, pwd: pwd, cpwd: req.body.cpwd },
                        validationError: errors.array()
                    });
                })
                .catch(err => {
                    console.log(err);
                    res.redirect('/login');
                })

        })
        .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
};

exports.postLogout = (req, res, next) => {
    req.session.destroy(err => {
        console.log(err);
        res.redirect('/');
    });
};


exports.getSignup = (req, res, next) => {
    let message = req.flash('error');
    if (message.length > 0) {
        message = message[0];
    } else {
        message = null;
    }
    res.render('auth/signup', {
        path: '/signup',
        pageTitle: 'SignUp Page',
        errorMessage: message,
        oldInput: { email: "", pwd: '', cpwd: '' },
        validationError: []
    });
};

exports.postSignup = (req, res, next) => {
    const email = req.body.email;
    const pwd = req.body.pwd;
    const error = validationResult(req);

    //For Email and password validation
    if (!error.isEmpty()) {
        return res.status(402).render('auth/signup', {
            path: '/signup',
            pageTitle: 'SignUp Page',
            errorMessage: error.array()[0].msg,
            oldInput: { email: email, pwd: pwd, cpwd: req.body.cpwd },
            validationError: error.array()
        });
    }

    bcrypt.hash(pwd, 12)
        .then(hashedpwd => {
            const user = new User({
                email: email,
                pwd: hashedpwd,
                cart: { itmes: [] }
            });
            return user.save()
        })
        .then(result => {

            const transporter = nodemailer.createTransport({

                host: "smtp.gmail.com",

                port: 587,

                secure: false,

                auth: {

                    user: 'jayproject86@gmail.com',

                    pass: 'Jay@8691062'
                }
            });

            const info = transporter.sendMail({
                to: email,

                from: 'jayproject86@gmail.com',

                subject: 'SignUp Successfull!',

                html: '<h1>You successfully signed Up!!</h1>',

            },
            );

            res.redirect('/login');
        })
        .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
}

exports.getReset = (req, res, next) => {
    let message = req.flash('error');
    if (message.length > 0) {
        message = message[0];
    } else {
        message = null;
    }

    res.render('auth/reset', {
        path: '/reset',
        pageTitle: 'Reset Password',
        errorMessage: message
    });
}

exports.postReset = (req, res, next) => {
    crypto.randomBytes(32, (err, buffer) => {
        if (err) {
            console.log(err);
            return res.redirect('/reset')
        }
        const token = buffer.toString('hex');
        User.findOne({ email: req.body.email })
            .then(user => {
                if (!user) {
                    req.flash('error', 'No account found on this email');
                    res.redirect('/reset')
                }
                user.resetToken = token;
                user.resetTokenExpiration = Date.now() + 3600000;
                return user.save();
            }).then(result => {
                res.redirect('/');
                const transporter = nodemailer.createTransport({

                    host: "smtp.gmail.com",

                    port: 587,

                    secure: false,

                    auth: {

                        user: 'jayproject86@gmail.com',

                        pass: 'Jay@8691062'
                    }
                });

                transporter.sendMail({
                    to: req.body.email,

                    from: 'jayproject86@gmail.com',

                    subject: 'Password Reset!',

                    html: `
                    <p>Your Reset Password request here..</p>
                    <p>Click this <a href="http://localhost:8686/reset/${token}">link</a> to set a New Password</p>

                    `,

                }
                )
            })
            .catch(err => {
                const error = new Error(err);
                error.httpStatusCode = 500;
                return next(error);
            });
    })
};

exports.getNewPassword = (req, res, next) => {
    const token = req.params.token;
    User.findOne({ resetToken: token, resetTokenExpiration: { $gt: Date.now() } })
        .then(user => {
            let message = req.flash('error');
            if (message.length > 0) {
                message = message[0];
            } else {
                message = null;
            }
            res.render('auth/newpassword', {
                path: '/new-password',
                pageTitle: 'New Password',
                errorMessage: message,
                userId: user._id.toString(),
                passwordToken: token
            })
        })
        .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });

};

exports.postNewPassword = (req, res, next) => {
    const newPassword = req.body.pwd;
    const userId = req.body.userId;
    const passwordToken = req.body.passwordToken;
    let resetUser;

    User.findOne({ resetToken: passwordToken, resetTokenExpiration: { $gt: Date.now() }, _id: userId })
        .then(user => {
            resetUser = user;
            return bcrypt.hash(newPassword, 12)
        }).then(hashedPassword => {
            resetUser.pwd = hashedPassword;
            resetUser.resetToken = null;
            resetUser.resetTokenExpiration = undefined;
            return resetUser.save();
        }).then(result => {
            res.redirect('/login');
        })
        .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
}