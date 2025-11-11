// app/user/update-username.jsx
// (此版本加入了 Clerk 錯誤訊息中文化處理)

import { useUser } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";
import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { Button, HelperText, Paragraph, Snackbar, TextInput, Title } from "react-native-paper";

export default function UpdateUsernameScreen() {
    const { user } = useUser();
    const router = useRouter();
    const [tempUsername, setTempUsername] = useState(user?.username || "");
    const [inputError, setInputError] = useState("");
    const [loading, setLoading] = useState(false);

    const [snackbarVisible, setSnackbarVisible] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState("");

    const usernameRules = "只能包含英文字母 (a-z, A-Z)、數字 (0-9)、底線 (_) 或減號 (-)。不能包含空格或中文。";

    const validateInput = (value) => {
        setTempUsername(value);
        if (!value.trim()) {
            setInputError("請輸入有效的使用者名稱");
        } else {
            const regex = /^[a-zA-Z0-9-_]+$/;
            if (!regex.test(value)) {
                setInputError(usernameRules);
            } else {
                // 👇 新增長度檢查 (Clerk 的基本規則)
                if (value.length < 4 || value.length > 64) {
                    setInputError("使用者名稱長度必須介於 4 到 64 個字元之間");
                } else {
                    setInputError(""); // 清除錯誤
                }
            }
        }
    };

    // ✅ 儲存使用者名稱
    const handleSaveUsername = async () => {
        // 在儲存前再次驗證一次，確保符合前端規則
        validateInput(tempUsername); // 確保觸發最新的驗證
        // 延遲一小段時間讓 state 更新完成
        await new Promise(resolve => setTimeout(resolve, 0));

        if (inputError || !tempUsername.trim() || loading) {
            console.log("前端驗證失敗或正在載入，取消儲存。錯誤:", inputError);
            return;
        }

        setLoading(true);
        try {
            console.log("正在嘗試更新 Clerk 用戶名:", tempUsername);
            await user.update({ username: tempUsername });
            console.log("Clerk 用戶名更新成功");
            setSnackbarMessage("✅ 使用者名稱已更新");
            setSnackbarVisible(true);
            setTimeout(() => {
                router.back();
            }, 1500);
        } catch (error) {
            console.error("❌ 更新 Clerk 用戶名失敗:", error);

            // ==========================================================
            // ===== 👇 這是我們新增的錯誤訊息中文化處理 👇 =====
            // ==========================================================
            let clerkError = "更新失敗，請稍後再試"; // 預設錯誤
            if (error.errors && error.errors[0] && error.errors[0].message) {
                const originalError = error.errors[0].message;
                console.log("Clerk 返回原始錯誤:", originalError);

                // 檢查是否是長度錯誤
                if (originalError.includes("between 4 and 64 characters")) {
                    clerkError = "使用者名稱長度必須介於 4 到 64 個字元之間";
                }
                // 檢查是否是已被佔用錯誤 (常見的 Clerk 錯誤碼或訊息)
                else if (error.errors[0].code === "form_identifier_exists" || originalError.includes("is already taken")) {
                    clerkError = "這個使用者名稱已經有人使用了，請換一個";
                }
                // 其他 Clerk 可能返回的格式錯誤 (雖然我們前端已擋掉大部分)
                else if (originalError.includes("valid characters")) {
                    clerkError = usernameRules; // 複用我們的規則提示
                }
                // 如果無法識別，顯示原始錯誤或通用錯誤
                else {
                    clerkError = `更新失敗 (${originalError})`; // 可以選擇顯示部分原始錯誤
                }
            }
            setInputError(clerkError); // 設置本地化的錯誤訊息
            // ==========================================================
            // ===== 👆 錯誤訊息中文化處理結束 👆 =====
            // ==========================================================
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <Title style={styles.title}>修改使用者名稱</Title>
            <Paragraph style={styles.currentUsername}>
                目前名稱：{user?.username || "未設定"}
            </Paragraph>

            <TextInput
                label="新的使用者名稱"
                mode="outlined"
                value={tempUsername}
                onChangeText={validateInput}
                error={!!inputError}
                style={styles.input}
                disabled={loading}
                autoCapitalize="none"
                autoCorrect={false}
            />

            {inputError ? (
                <HelperText type="error" visible={true} style={styles.helperText}>
                    {inputError}
                </HelperText>
            ) : (
                <HelperText type="info" visible={true} style={styles.helperText}>
                    {usernameRules}
                </HelperText>
            )}

            <Button
                mode="contained"
                onPress={handleSaveUsername}
                style={styles.button}
                // 👇 儲存按鈕的禁用條件，現在只檢查 inputError (因為 validateInput 已包含長度檢查)
                disabled={!!inputError || !tempUsername.trim() || loading}
                loading={loading}
            >
                儲存變更
            </Button>

            <Button
                mode="outlined"
                onPress={() => router.back()}
                style={styles.button}
                disabled={loading}
            >
                取消
            </Button>

            <Snackbar
                visible={snackbarVisible}
                onDismiss={() => setSnackbarVisible(false)}
                duration={1500}
                style={{ backgroundColor: "#333" }}
            >
                {snackbarMessage}
            </Snackbar>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: '#f8f9fa',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 10,
        textAlign: 'center',
    },
    currentUsername: {
        fontSize: 16,
        color: '#6c757d',
        marginBottom: 20,
        textAlign: 'center',
    },
    input: {
        marginBottom: 5,
    },
    helperText: {
        marginBottom: 10,
        fontSize: 13,
    },
    button: {
        marginTop: 10,
        paddingVertical: 8,
    },
});