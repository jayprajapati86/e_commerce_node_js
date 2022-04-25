const path = require('path');
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const session = require('express-session');
const mongodbStore = require('connect-mongodb-session')(session);
const csrf = require('csurf');
const flash = require('connect-flash');

const error_controller = require('./controllers/error');
const User = require('./modules/user');

//env
require('dotenv').config();
const DATABASE_URL = process.env.DATABASE_URL;
const PORT = process.env.PORT;

const app = express();
const store = new mongodbStore({
  uri: DATABASE_URL,
  collection: 'sessions'
});

const csrfProtection = csrf();

app.set('view engine', 'ejs');
app.set('views', 'views');

// Routes
const admin_routes = require('./routes/admin');
const shop_routes = require('./routes/shop');
const auth_routes = require('./routes/auth');


app.use(bodyParser.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, 'public')));
app.use(session({ secret: 'my secret', resave: false, saveUninitialized: false, store: store }));

app.use((req, res, next) => {
  if (!req.session.user) {
    return next();
  }
  User.findById(req.session.user._id)
    .then(user => {
      if (!user) {
        return next();
      }
      req.user = user;
      next();
    })
    .catch(err => {
      next(new Error(err));
    });
});

app.use(csrfProtection);
app.use(flash());

app.use((req, res, next) => {
  res.locals.varified = req.session.isLoggedIn;
  res.locals.csrfToken = req.csrfToken();
  next();
});

app.use(admin_routes);
app.use(shop_routes);
app.use(auth_routes);

app.get('/500', error_controller.get500);

app.use(error_controller.get404);

app.use((error, req, res, next) => {
  console.log(error);
  res.status(500).render('500', {
    pageTitle: 'Error!',
    path: '/500',
    varified: req.session.isLoggedIn,
    csrfToken: req.csrfToken(),
  });
});


mongoose
  .connect(DATABASE_URL)
  .then(result => {
    app.listen(PORT, () => {
      console.log('Server is running on http://localhost:' + PORT);
    });
  })
  .catch(err => {
    console.log(err);
  })


