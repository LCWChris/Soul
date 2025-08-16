import { useRouter } from 'expo-router';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function Education() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      {/* 教學區 */}
      <TouchableOpacity
        style={[styles.section, styles.topSection]}
        onPress={() => router.push('education/teach-screen')}
      >
        <Text style={styles.text}>進入教學區</Text>
      </TouchableOpacity>

      {/* 單字區 */}
      <TouchableOpacity
        style={[styles.section, styles.bottomSection]}
        onPress={() => router.push('education/word-learning/word-learning-screen')}
      >
        <Text style={styles.text}>進入單字學習區</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    flex: 1,
    paddingBottom: 60, // 為底部導航留空間
  },
  section: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  topSection: {
    backgroundColor: '#BFDBFE', // 淺藍
  },
  bottomSection: {
    backgroundColor: '#1E3A8A', // 深藍
  },
  text: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
});