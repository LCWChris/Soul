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

        console.log(`✅ [POST] userId=${userId} → 問卷已儲存/更新`);

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
            console.log(`ℹ️ [GET] userId=${userId} → 找不到資料`);
            return res.status(404).json({ error: "找不到資料" });
        }

        console.log(`✅ [GET] userId=${userId} → 成功讀取問卷`);

        res.json({ success: true, data: preference });
    } catch (err) {
        console.error("❌ 讀取問卷失敗:", err);
        res.status(500).json({
            error: err.message || "伺服器錯誤",
            stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
        });
    }
});

// 刪除某個使用者的問卷回答 (強化版)
router.delete("/:userId", async (req, res) => {
    try {
        const userId = req.params.userId;
        const result = await UserPreference.deleteMany({ userId }); // ✅ 改 deleteMany

        if (result.deletedCount === 0) {
            console.log(`🗑️ [DELETE] userId=${userId} → 找不到任何偏好資料`);
            return res.status(404).json({ error: "找不到資料" });
        }

        console.log(
            `🗑️ [DELETE] userId=${userId} → 已刪除 ${result.deletedCount} 筆偏好資料`
        );

        res.json({
            success: true,
            message: `✅ 已刪除 ${result.deletedCount} 筆偏好資料`,
            deletedCount: result.deletedCount,
        });
    } catch (err) {
        console.error("❌ 刪除問卷失敗:", err);
        res.status(500).json({
            error: err.message || "伺服器錯誤",
            stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
        });
    }
});

module.exports = router;
