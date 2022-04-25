const Sq = require('sequelize');

const sequelize = require('../util/database');

const CartItem = sequelize.define('cartitems', {
    id: {
        type: Sq.INTEGER,
        autoIncrement: true,
        allowNull: false,
        primaryKey: true
    },
    qty: Sq.INTEGER
});

module.exports = CartItem;