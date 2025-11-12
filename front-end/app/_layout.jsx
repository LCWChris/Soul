import InitialLayout from '@/components/initialLayout';
import { ClerkProvider } from '@clerk/clerk-expo';
import { tokenCache } from '@clerk/clerk-expo/token-cache';
import { StatusBar } from 'expo-status-bar';
import { PaperProvider } from 'react-native-paper'; // ⬅️ 新增
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import './globals.css';

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;

if (!publishableKey) {
  throw new Error(
    'Missing Publishable Key. Please set EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY in your .env',
  );
}

export default function RootLayout() {
  return (
    <ClerkProvider tokenCache={tokenCache} publishableKey={publishableKey}>
      <SafeAreaProvider>
        <SafeAreaView style={{ flex: 1 }}>
          <PaperProvider>  
            <StatusBar style="dark" />
            <InitialLayout />
          </PaperProvider>
        </SafeAreaView>
      </SafeAreaProvider>
    </ClerkProvider>
  );
}
