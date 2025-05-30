const express = require('express');
const router = express.Router();
const controllers = require('../controllers');

// Create new order
router.post(
    '/create',
    controllers.order.create
);

// Calculate cart price
router.post(
    '/calculate-price',
    controllers.order.calculateCartPrice
);

// Get all orders with pagination
router.get(
    '/',
    controllers.order.getAll
);

// Get order by ID
router.get(
    '/:id',
    controllers.order.getById
);

// Update order status
router.patch(
    '/:id/status',
    controllers.order.updateStatus
);

module.exports = router;
