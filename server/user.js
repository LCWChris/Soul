const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    clerkUserId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    firstName: {
      type: String,
      default: "",
    },
    lastName: {
      type: String,
      default: "",
    },
    email: {
      type: String,
      required: true,
    },
    identity: {
      type: String,
      default: "",
    },
    proficiency_level: {
      type: String,
      default: "",
    },
    profileImage: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true, // 自動添加 createdAt 和 updatedAt
  }
);

// 添加索引以提高查詢性能
UserSchema.index({ email: 1 });

const User = mongoose.model("User", UserSchema);

module.exports = User;
