const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const userSchema = new Schema({
    email: {
        type: String,
        required: true
    },
    pwd: {
        type: String,
        required: true
    },
    resetToken: String,
    resetTokenExpiration: Date,
    cart: {
        items: [{ productID: { type: Schema.Types.ObjectId, required: true, ref: 'Product' }, qty: { type: Number, required: true } }]
    }
});

userSchema.methods.addToCart = function (product) {
    const cartporductIndex = this.cart.items.findIndex(cp => {
        return cp.productID.toString() === product._id.toString();
    });
    let newQty = 1;
    const updatedCartItems = [...this.cart.items];

    if (cartporductIndex >= 0) {
        newQty = this.cart.items[cartporductIndex].qty + 1;
        updatedCartItems[cartporductIndex].qty = newQty
    } else {
        updatedCartItems.push({ productID: product._id, qty: newQty })
    }
    const updatedCart = {
        items: updatedCartItems
    };
    this.cart = updatedCart;
    return this.save()
}

userSchema.methods.removeFromCart = function (productID) {
    const updatedCartItems = this.cart.items.filter(item => {
        return item.productID.toString() !== productID.toString();
    });
    this.cart.items = updatedCartItems;
    return this.save()
}

userSchema.methods.clearCart = function () {
    this.cart = { items: [] };
    return this.save();
}

module.exports = mongoose.model('User', userSchema)
