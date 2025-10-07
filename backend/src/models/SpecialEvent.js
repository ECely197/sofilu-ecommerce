// En: backend/src/models/SpecialEvent.js
const mongoose = require("mongoose");
const { Schema } = mongoose;

const specialEventSchema = new Schema(
  {
    title: { type: String, required: true },
    subtitle: { type: String },
    imageUrl: { type: String, required: true },
    isActive: { type: Boolean, default: false, index: true },
    linkedProducts: [
      {
        type: Schema.Types.ObjectId,
        ref: "Product",
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("SpecialEvent", specialEventSchema);
