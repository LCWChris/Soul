import { COLORS } from '@/constants/theme';
import { styles } from '@/styles/auth.styles';
import { useSSO } from '@clerk/clerk-expo';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useRouter } from 'expo-router';
import { Image, Text, TouchableOpacity, View } from 'react-native';

export default function login() {
  const { startSSOFlow } = useSSO();
  const router = useRouter();
  // Google and Facebook SSO handlers
  const handleGoogleSignIn = async () => {
    try {
      const { createdSessionId, setActive } = await startSSOFlow({
        strategy: 'oauth_google',
      });
      console.log('createdSessionId', createdSessionId, 'setActive', setActive);
      if (createdSessionId && setActive) {
        setActive({ session: createdSessionId });
        router.replace("/");
      }
    } catch (error) {
      console.error('OAuth error:', error);
    }
  };

  const handleFacebookSignIn = async () => {
    try {
      const { createdSessionId, setActive } = await startSSOFlow({
        strategy: 'oauth_facebook',
      });

      if (createdSessionId && setActive) {
        setActive({ session: createdSessionId });
        router.replace("/");
      }
    } catch (error) {
      console.error('OAuth error:', error);
    }
  };

  return (
    <View style={styles.container}>
      {/* Brand Section */}
      <View style={styles.brandSection}>
        <View style={styles.logoContainer}>
          <Image
            source={require('../../assets/images/icon.png')}
            style={styles.logo}
          />
        </View>
        <Text style={styles.tagline}>一手學手語，雙手說世界</Text>
      </View>

      {/* Illustration */}
      <View style={styles.illustrationContainer}>
        <Image
          style={styles.illustration}
          source={require('../../assets/images/auth-bh-2.png')}
          resizeMode="cover"
        ></Image>
      </View>

      {/* Login Section */}
      <View style={styles.loginSection}>
        <TouchableOpacity
          style={styles.authButton}
          onPress={handleGoogleSignIn}
          activeOpacity={0.9}
        >
          <View style={styles.authIconContainer}>
            <MaterialCommunityIcons
              name="google"
              size={24}
              color={COLORS.surface}
            />
          </View>
          <Text style={styles.authButtonText}>使用 Google 登入</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.authButton}
          onPress={handleFacebookSignIn}
          activeOpacity={0.9}
        >
          <View style={styles.authIconContainer}>
            <MaterialCommunityIcons
              name="facebook"
              size={24}
              color={COLORS.surface}
            />
          </View>
          <Text style={styles.authButtonText}>使用 Facebook 登入</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
