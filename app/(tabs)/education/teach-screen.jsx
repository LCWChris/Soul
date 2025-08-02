import { useRouter } from "expo-router";
import { ScrollView, StyleSheet, Text, TouchableOpacity } from "react-native";

export default function TeachScreen() {
  const router = useRouter();
  const volumes = [
    { id: "1", title: "第一冊：手語基礎入門" },
    { id: "2", title: "第二冊：日常溝通用語" },
    { id: "3", title: "第三冊：家庭與朋友" },
    { id: "4", title: "第四冊：學校生活" },
    { id: "5", title: "第五冊：情緒與感覺" },
    { id: "6", title: "第六冊：時間與天氣" },
    { id: "7", title: "第七冊：地點與交通" },
    { id: "8", title: "第八冊：購物與飲食" },
    { id: "9", title: "第九冊：緊急與求助" },
    { id: "10", title: "第十冊：社會與文化" },
  ];

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>教材總覽</Text>
      {volumes.map((volume) => (
        <TouchableOpacity
          key={volume.id}
          style={styles.folder}
          onPress={() => router.push(`/teach/${volume.id}`)} // 導向第 N 冊課程選單頁
        >
          <Text style={styles.folderText}>{volume.title}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#FFFFFF",
    padding: 20,
    flexGrow: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    color: "#1E3A8A",
  },
  folder: {
    backgroundColor: "#BFDBFE", // 淺藍
    paddingVertical: 20,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  folderText: {
    fontSize: 18,
    color: "#1E3A8A", // 深藍
    fontWeight: "600",
  },
});
