const mongoose = require('mongoose');

const skuSchema = new mongoose.Schema({
    _id: {
        type: mongoose.Schema.Types.ObjectId,
        auto: true
    },
    value: { type: String},
    type: { type: string },
    code: { type: String }
});

const Sku = mongoose.model('Sku', skuSchema);

module.exports = { Sku }