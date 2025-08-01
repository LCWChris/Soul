import { useRouter } from 'expo-router';
import { Button, Text, View } from 'react-native';

export default function TranslationHome() {
  const router = useRouter();

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ fontSize: 24, marginBottom: 20 }}>翻譯首頁</Text>
      <Button title="前往翻譯頁面" onPress={() => router.push('translation/translate-screen')} />
    </View>
  );
}
