const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const ObjectId = mongoose.Types.ObjectId;

const InventoryLogSchema = new Schema({
  inventory: { 
    type: Schema.Types.ObjectId, 
    ref: "Inventory", 
    required: true,
    index: true 
  },
  action: { 
    type: String, 
    required: true, 
    enum: ["ADD", "UPDATE", "SELL", "BUY", "DELETE", "RESTOCK"] 
  },
  performedBy: { 
    type: Schema.Types.ObjectId, 
    ref: "User", 
    required: true 
  },
  changeDetails: {
    // This can be any JSON object containing details of the change.
    type: Schema.Types.Mixed,
    default: {}
  },
  notes: { 
    type: String 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

module.exports = mongoose.model("InventoryLog", InventoryLogSchema);
