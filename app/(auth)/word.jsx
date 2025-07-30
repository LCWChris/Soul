import { SafeAreaView, StyleSheet } from "react-native";
import WordLearningPage from "./WordLearningPage"; // 同一資料夾，路徑為 ./ 而非 ../

export default function WordPage() {
  return (
    <SafeAreaView style={styles.container}>
      <WordLearningPage />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
});
