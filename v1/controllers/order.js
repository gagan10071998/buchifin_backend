// controllers/order.js
const Models = require("../../models");
const universal = require("../../utils");
const CODES = require("../../constants").Codes;
const MESSAGES = require("../../constants").Messages;
const ObjectId = require("mongoose").Types.ObjectId;
// Import the inventory helper method from the Inventory controller
const { reserveInventory } = require("./inventory");

/**
 * Helper function to find an existing customer by phone.
 * If not found, creates a new customer using provided details.
 * Returns the customer document.
 */
const getOrCreateCustomer = async (customerData) => {
    // Check if a customer exists with the given primary phone number
    let customer = await Models.User.findOne({
        "phone.phone": customerData.phone,
        isDeleted: false
    });
    if (!customer) {
        // Create a new customer using provided details
        customer = await new Models.User({
            name: customerData.name,
            email: customerData.email || "",
            phone: [{
                phone: customerData.phone,
                countryCode: customerData.countryCode || "91",
                phoneType: "PRIMARY"
            }],
            address: [
                {
                    addressType: "billing",
                    address: customerData.billingAddress ? customerData.billingAddress.address : "",
                    city: customerData.billingAddress ? customerData.billingAddress.city : "",
                    state: customerData.billingAddress ? customerData.billingAddress.state : "",
                    country: customerData.billingAddress ? customerData.billingAddress.country : "",
                    zip: customerData.billingAddress ? customerData.billingAddress.zip : ""
                },
                {
                    addressType: "shipping",
                    address: customerData.shippingAddress ? customerData.shippingAddress.address : "",
                    city: customerData.shippingAddress ? customerData.shippingAddress.city : "",
                    state: customerData.shippingAddress ? customerData.shippingAddress.state : "",
                    country: customerData.shippingAddress ? customerData.shippingAddress.country : "",
                    zip: customerData.shippingAddress ? customerData.shippingAddress.zip : ""
                }
            ],
            type: ["CUSTOMER"],
            status: "ACTIVE",
            // Note: In production, password should be securely generated or managed
            password: "defaultPassword"
        }).save();
    }
    return customer;
};

module.exports = {
    /**
     * Create a new order.
     * Flow:
     * 1. Check for customer using phone. If not found, create one.
     * 2. For each order item, check inventory & reserve stock.
     * 3. Fetch product details to create product snapshots.
     * 4. Calculate subTotal (and grandTotal) on the backend.
     * 5. Create the order with pending payment status.
     */
    create: async (req, res, next) => {
        try {
            // --- Step 1: Customer Lookup or Creation ---
            let customer;
            // If a customer ObjectId is provided, use that.
            if (req.body.customer) {
                customer = await Models.User.findById(req.body.customer);
                if (!customer) {
                    return universal.response(
                        res,
                        CODES.NOT_FOUND,
                        "Customer not found",
                        {}
                    );
                }
            } else if (req.body.phone) {
                // If phone (and other details) are provided, try to find or create a customer.
                customer = await getOrCreateCustomer({
                    phone: req.body.phone,
                    name: req.body.name,
                    email: req.body.email,
                    countryCode: req.body.countryCode,
                    billingAddress: req.body.billingAddress,
                    shippingAddress: req.body.shippingAddress
                });
                // Save a customer snapshot in the order (if needed)
                req.body.customerSnapshot = {
                    name: customer.name,
                    phone: customer.phone,
                    email: customer.email,
                    address: customer.address
                };
            } else {
                return universal.response(
                    res,
                    CODES.BAD_REQUEST,
                    "Customer information is missing (provide customer id or phone number)",
                    {}
                );
            }
            // Set the customer field (using the found/created customer)
            req.body.customer = customer._id;
            req.body.customerModel = "User"; // adjust if you support Company as well

            // --- Step 2: Inventory Checks and Product Snapshots ---
            const retailerId = req.body.retailer;
            if (!retailerId) {
                return universal.response(
                    res,
                    CODES.BAD_REQUEST,
                    "Retailer information is missing",
                    {}
                );
            }

            // Initialize subTotal for calculating total order price on backend
            let subTotal = 0;

            // Iterate through each order item
            for (let item of req.body.items) {
                if (!item.product || !item.quantity) {
                    return universal.response(
                        res,
                        CODES.BAD_REQUEST,
                        "Each order item must include a product and quantity",
                        {}
                    );
                }
                // Reserve (deduct) the required quantity from the retailer's inventory
                const inventoryItem = await reserveInventory(item.product, item.quantity, retailerId, req.user._id);
                // Fetch product details to create a product snapshot
                const productDetails = await Models.Product.findById(item.product).lean();
                if (!productDetails) {
                    return universal.response(
                        res,
                        CODES.NOT_FOUND,
                        "Product not found",
                        {}
                    );
                }
                console.log("INVENTORY ITEM",inventoryItem);
                // Build product snapshot (this snapshot is stored in the order)
                item.productSnapshot = {
                    name: productDetails.name,
                    sku: productDetails.sku,
                    basePrice: inventoryItem.sellingPrice,
                    hsnCode: productDetails.hsnCode // ensure hsnCode is included
                };
                console.log("ITEM1", item);
                // Calculate price per unit and total amount
                item.pricePerUnit = inventoryItem.sellingPrice;
                item.totalAmount = inventoryItem.sellingPrice * item.quantity * (1 - inventoryItem.discount / 100);
                console.log("ITEM2", item);

                // Calculate subTotal (you can also include discount, taxes, etc. here)
                subTotal += item.totalAmount;
                console.log("SUBTOTAL", subTotal);
            }

            // --- Step 3: Calculate Totals ---
            // For security, calculate totals on the backend.
            req.body.subTotal = subTotal;
            // Here, we assume no extra charges; set grandTotal equal to subTotal.
            req.body.grandTotal = subTotal;
            console.log("GRANDTOTAL", req.body.grandTotal);
            // Set default payment status to "PENDING"
            req.body.payment = {
                status: "PENDING",
                method: req.body.payment && req.body.payment.method ? req.body.payment.method : "ONLINE"
            };
            console.log("PAYMENT", req.body.payment);

            // Generate and include orderNumber
            req.body.orderNumber = `ORD-${Date.now()}`; // Simple order number generation

            // --- Step 4: Create Order ---
            req.body.createdBy = req.user._id;
            const order = await new Models.Order(req.body).save();

            return universal.response(
                res,
                CODES.OK,
                MESSAGES.ORDER_CREATED_SUCCESSFULLY,
                order
            );
        } catch (error) {
            next(error);
        }
    },

    // List orders with pagination and optional filters
    getAll: async (req, res, next) => {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const skip = (page - 1) * limit;
            let query = {}; // Add any additional filters if needed
            const total = await Models.Order.countDocuments(query);
            const orders = await Models.Order.find(query)
                .skip(skip)
                .limit(limit)
                .sort({ createdAt: -1 })
                .lean();
            return universal.response(
                res,
                CODES.OK,
                MESSAGES.DATA_FETCHED_SUCCESSFULLY,
                {
                    orders,
                    pagination: { total, page, pages: Math.ceil(total / limit) }
                }
            );
        } catch (error) {
            next(error);
        }
    },

    // Get order details by ID
    getById: async (req, res, next) => {
        try {
            const order = await Models.Order.findOne({ _id: new ObjectId(req.params.id) }).lean();
            if (!order) {
                return universal.response(
                    res,
                    CODES.NOT_FOUND,
                    MESSAGES.ORDER_NOT_FOUND,
                    {}
                );
            }
            return universal.response(
                res,
                CODES.OK,
                MESSAGES.DATA_FETCHED_SUCCESSFULLY,
                order
            );
        } catch (error) {
            next(error);
        }
    },

    // Update order status (e.g., checkout, cancellation)
    updateStatus: async (req, res, next) => {
        try {
            const { status, comment } = req.body;
            const order = await Models.Order.findOne({ _id: new ObjectId(req.params.id) });
            if (!order) {
                return universal.response(
                    res,
                    CODES.NOT_FOUND,
                    MESSAGES.ORDER_NOT_FOUND,
                    {}
                );
            }
            // Assume the Order model has an instance method updateStatus to track history
            await order.updateStatus(status, comment, req.user._id);
            return universal.response(
                res,
                CODES.OK,
                MESSAGES.ORDER_STATUS_UPDATED,
                order
            );
        } catch (error) {
            next(error);
        }
    },

    calculateCartPrice: async (req, res, next) => {
        try {
            // Expected request body:
            // {
            //   items: [
            //     {
            //       product: "<Product ObjectId>",
            //       retailer: "<Retailer ObjectId>",
            //       quantity: <Number>
            //     },
            //     ...
            //   ]
            // }
            const cartItems = req.body.items;
            if (!cartItems || !Array.isArray(cartItems) || cartItems.length === 0) {
                return universal.response(
                    res,
                    CODES.BAD_REQUEST,
                    "Cart items are missing",
                    {}
                );
            }
            let grandTotal = 0;
            let lineItems = [];

            // Process each cart item
            for (let item of cartItems) {
                if (!item.product || !item.retailer || !item.quantity) {
                    return universal.response(
                        res,
                        CODES.BAD_REQUEST,
                        "Each cart item must have product, retailer, and quantity",
                        {}
                    );
                }
                // Find the inventory record matching product and retailer
                const inventory = await Models.Inventory.findOne({
                    product: item.product,
                    retailer: item.retailer,
                    isDeleted: false
                }).lean();
                if (!inventory) {
                    return universal.response(
                        res,
                        CODES.NOT_FOUND,
                        `Inventory not found for product ${item.product}`,
                        {}
                    );
                }
                if (inventory.quantity < item.quantity) {
                    return universal.response(
                        res,
                        CODES.BAD_REQUEST,
                        `Insufficient stock for product ${item.product}`,
                        {}
                    );
                }

                // Calculate price per unit:
                // Base price is the sellingPrice from inventory.
                const unitPrice = inventory.sellingPrice;
                // Apply discount (assumed as a percentage)
                const discountPercentage = inventory.discount || 0;
                const netUnitPrice = unitPrice - (unitPrice * discountPercentage / 100);
                // Calculate taxes:
                const cgst = netUnitPrice * (inventory.cgstPercentage || 0) / 100;
                const sgst = netUnitPrice * (inventory.sgstPercentage || 0) / 100;
                const tcs = netUnitPrice * (inventory.tcsPercentage || 0) / 100;
                // Optionally, you might also use gstPercentage, but typically GST is the sum of CGST and SGST.
                const finalUnitPrice = netUnitPrice + cgst + sgst + tcs;
                const lineTotal = finalUnitPrice * item.quantity;
                grandTotal += lineTotal;
                lineItems.push({
                    product: inventory.product,
                    quantity: item.quantity,
                    unitPrice,
                    discountPercentage,
                    netUnitPrice,
                    cgst,
                    sgst,
                    tcs,
                    finalUnitPrice,
                    lineTotal
                });
            }
            return universal.response(
                res,
                CODES.OK,
                "Cart price calculated successfully",
                { lineItems, grandTotal }
            );
        } catch (error) {
            next(error);
        }
    }
};
