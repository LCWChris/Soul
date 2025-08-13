import { useAuth } from '@clerk/clerk-expo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';

export default function Index() {
  const [isLoading, setIsLoading] = useState(true);
  const [hasFilled, setHasFilled] = useState(false);
  const { isSignedIn, user } = useAuth();

  useEffect(() => {
    const checkQuestionnaire = async () => {
      try {
        if (user?.id) {
          const filled = await AsyncStorage.getItem(`questionnaireFilled_${user.id}`);
          console.log('問卷紀錄值：', filled);
          setHasFilled(filled === 'true');
        }
      } catch (e) {
        console.error('讀取問卷狀態失敗', e);
      } finally {
        setIsLoading(false);
      }
    };

    checkQuestionnaire();
  }, [user]);

  if (!isSignedIn) {
    return <Redirect href="/(auth)/sign-in" />;
  }

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return hasFilled ? <Redirect href="/(tabs)" /> : <Redirect href="/onboarding/preference" />;
}
