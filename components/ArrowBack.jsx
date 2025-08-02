import { useRouter } from "expo-router";
import { StyleSheet, TouchableOpacity } from "react-native";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";

export default function ArrowBack() {
  const router = useRouter(); // 使用 useRouter 來獲取路由對象
  return (
    <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
      <MaterialCommunityIcons name="arrow-left" size={20} color="black" />
    </TouchableOpacity>
  );
}
const styles = StyleSheet.create({
  backButton: {
    position: "absolute",
    top: 20,
    left: 20,
    padding: 10,
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    borderRadius: 50,
    zIndex: 1,
  },
});
