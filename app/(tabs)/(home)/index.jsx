import { SignedIn, useUser } from '@clerk/clerk-expo';
import { Link } from 'expo-router';
import { useEffect } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

export default function Page() {
  const { user } = useUser();

  // ✅ 新增：自動補上 username（首次登入）
  useEffect(() => {
    const setUsernameIfMissing = async () => {
      if (user && !user.username) {
        const randomId = Math.floor(100000000 + Math.random() * 900000000);
        const generatedUsername = `user${randomId}`;
        try {
          await user.update({ username: generatedUsername });
          console.log('✅ 自動設定 username:', generatedUsername);
        } catch (err) {
          console.error('❌ 設定 username 失敗:', err);
        }
      }
    };
    setUsernameIfMissing();
  }, [user]);

  return (
    <View className="flex-1 justify-center items-center bg-red-100">
      <SignedIn>
        <Text className="text-red-800 font-bold">
          Hello, {user?.username || user?.emailAddresses[0]?.emailAddress}
        </Text>
        <Link href="HomeScreenTest" push asChild>
          <TouchableOpacity className="mt-4 bg-red-500 px-4 py-2 rounded">
            <Text>跳轉測試頁面</Text>
          </TouchableOpacity>
        </Link>
      </SignedIn>
    </View>
  );
}
