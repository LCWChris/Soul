const express = require("express");
const router = express.Router();
const UserPreference = require("../models/UserPreference");

// 儲存或更新問卷回覆
router.post("/", async (req, res) => {
    try {
        const { userId, answers } = req.body;

        if (!userId || !answers) {
            return res.status(400).json({ error: "缺少 userId 或 answers" });
        }

        // upsert: true → 已有就更新，沒有就新增
        const result = await UserPreference.findOneAndUpdate(
            { userId },
            { answers },
            { new: true, upsert: true }
        );

        res.json({ success: true, data: result });
    } catch (err) {
        console.error("❌ 儲存問卷失敗:", err);
        res.status(500).json({
            error: err.message || "伺服器錯誤",
            stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
        });
    }
});

// 讀取某個使用者的問卷回答
router.get("/:userId", async (req, res) => {
    try {
        const userId = req.params.userId;
        const preference = await UserPreference.findOne({ userId });

        if (!preference) {
            return res.status(404).json({ error: "找不到資料" });
        }

        res.json({ success: true, data: preference });
    } catch (err) {
        console.error("❌ 讀取問卷失敗:", err);
        res.status(500).json({
            error: err.message || "伺服器錯誤",
            stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
        });
    }
});

// 刪除某個使用者的問卷回答
router.delete("/:userId", async (req, res) => {
    try {
        const userId = req.params.userId;
        const result = await UserPreference.findOneAndDelete({ userId });

        if (!result) {
            return res.status(404).json({ error: "找不到資料" });
        }

        res.json({ success: true, message: "問卷已刪除" });
    } catch (err) {
        console.error("❌ 刪除問卷失敗:", err);
        res.status(500).json({
            error: err.message || "伺服器錯誤",
            stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
        });
    }
});

module.exports = router;
