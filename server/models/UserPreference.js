const mongoose = require("mongoose");

const UserPreferenceSchema = new mongoose.Schema(
    {
        userId: { type: String, required: true },
        answers: { type: Map, of: String, required: true },
    },
    { timestamps: true }
);

module.exports = mongoose.model("UserPreference", UserPreferenceSchema);
