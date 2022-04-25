const Sq = require('sequelize');

const sequelize = require('../util/database');

const OrderItem = sequelize.define('orderitem', {
    id: {
        type: Sq.INTEGER,
        autoIncrement: true,
        allowNull: false,
        primaryKey: true
    },
    qty: Sq.INTEGER
});

module.exports = OrderItem;
