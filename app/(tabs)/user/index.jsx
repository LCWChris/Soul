import { SignOutButton } from '@/components/SignOutButton';
import { useUser } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function SettingScreen() {
  const { user } = useUser();
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [tempUsername, setTempUsername] = useState('');
  const [inputError, setInputError] = useState('');

  // ✅ 即時檢查輸入內容
  const validateInput = (value) => {
    setTempUsername(value);
    if (!value.trim()) {
      setInputError('請輸入有效的使用者名稱');
    } else {
      const regex = /^[a-zA-Z0-9-_]+$/;
      if (!regex.test(value)) {
        setInputError('只能使用英數字、減號(-)、底線(_)，不能包含空格或中文');
      } else {
        setInputError('');
      }
    }
  };

  // ✅ 儲存 username
  const handleSaveUsername = async () => {
    setInputError('');

    if (!tempUsername.trim()) {
      setInputError('請輸入有效的使用者名稱');
      return;
    }

    const regex = /^[a-zA-Z0-9-_]+$/;
    if (!regex.test(tempUsername)) {
      setInputError('只能使用英數字、減號(-)、底線(_)，不能包含空格或中文');
      return;
    }

    try {
      await user.update({ username: tempUsername });
      Alert.alert('成功', '使用者名稱已更新');
      setShowModal(false);
    } catch (error) {
      console.error('更新失敗:', error);

      let errorMessage = '設定失敗，請稍後再試';
      if (error.errors?.length > 0) {
        errorMessage = error.errors[0].message;
      } else if (error.message) {
        errorMessage = error.message;
      }

      if (error.status === 403 || errorMessage.toLowerCase().includes('verification')) {
        setInputError('您目前的登入狀態已失效，請先登出並重新登入後再嘗試。');
        return;
      }

      if (errorMessage.toLowerCase().includes('username is taken')) {
        setInputError('該使用者名稱已被使用，請嘗試其他名稱');
        return;
      }

      Alert.alert('錯誤', errorMessage);
    }
  };

  // ✅ 註銷帳號功能
  const handleDeleteAccount = async () => {
    if (!user) {
      const msg = '使用者資料尚未載入，請稍後再試';
      Platform.OS === 'web' ? alert(msg) : Alert.alert('錯誤', msg);
      return;
    }

    const showAlert = (title, message) => {
      Platform.OS === 'web' ? alert(`${title}\n\n${message}`) : Alert.alert(title, message);
    };

    const confirmDelete = async () => {
      try {
        await user.delete();
        showAlert('帳號已刪除', '您的帳號已成功註銷。');
        router.replace('/(auth)/sign-in');
      } catch (error) {
        console.error('❌ 刪除帳號失敗:', error);
        let msg = '無法刪除帳號，請稍後再試';
        if (error.status === 403) {
          msg = '您的登入驗證已失效，請先登出並重新登入後再嘗試。';
        }
        showAlert('錯誤', msg);
      }
    };

    if (Platform.OS === 'web') {
      const confirmed = window.confirm('此操作無法復原，帳號資料將永久刪除，確定要繼續嗎？');
      if (confirmed) await confirmDelete();
    } else {
      Alert.alert('確認註銷帳號', '此操作無法復原，帳號資料將永久刪除，確定要繼續嗎？', [
        { text: '取消', style: 'cancel' },
        { text: '確定', style: 'destructive', onPress: confirmDelete },
      ]);
    }
  };

  return (
    <ScrollView className="flex-1 bg-white px-6 py-8">
      <View>
        <Text className="text-2xl font-bold text-gray-800 mb-6">個人檔案設定</Text>
        <TouchableOpacity
          className="bg-blue-100 rounded-lg p-4 mb-4 w-64 self-center"
          onPress={() => setShowModal(true)}
        >
          <Text className="text-base text-blue-700 font-semibold text-center">
            修改使用者名稱
          </Text>
        </TouchableOpacity>
      </View>

      {/* 帳號管理 */}
      <View>
        <Text className="text-2xl font-bold text-gray-800 mb-6">帳號管理</Text>
        <View>
          <SignOutButton />
        </View>

        <TouchableOpacity
          className="bg-red-100 rounded-lg p-4 mb-4 w-64 self-center"
          onPress={handleDeleteAccount}
        >
          <Text className="text-base text-red-700 font-semibold text-center">註銷帳號</Text>
        </TouchableOpacity>
      </View>

      <Modal visible={showModal} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>輸入新的使用者名稱</Text>
            <Text style={styles.ruleText}>
              1.只能使用英數字、減號(-)、底線(_)，不能包含空格或中文。
              {'\n'}
              2.大寫字母會自動轉為小寫。
            </Text>
            <TextInput
              style={[styles.input, inputError ? { borderColor: 'red' } : null]}
              placeholder="新使用者名稱"
              value={tempUsername}
              onChangeText={validateInput}
            />
            {inputError && (
              <Text style={{ color: 'red', fontSize: 12, marginBottom: 8 }}>{inputError}</Text>
            )}
            <TouchableOpacity
              style={[styles.button, { backgroundColor: '#10b981' }]}
              onPress={handleSaveUsername}
            >
              <Text style={styles.buttonText}>儲存</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, { backgroundColor: '#ccc' }]}
              onPress={() => setShowModal(false)}
            >
              <Text style={styles.buttonText}>取消</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  modalContent: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    width: '80%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  ruleText: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    marginBottom: 5,
    borderRadius: 5,
  },
  button: {
    padding: 12,
    borderRadius: 8,
    marginTop: 5,
  },
  buttonText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: 'bold',
  },
});
