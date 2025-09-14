import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Dimensions,
  Image,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { Button, Card, ProgressBar, Text } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight(); // 新增

  // 模擬用戶數據
  const user = {
    name: "仕彥",
    lastLesson: { volume: 4, unit: 2, title: "學校生活" },
    progress: 0.45,
    weeklyTarget: 20,
    weeklyCompleted: 9,
  };

  // 模擬推薦課程資料
  const recommendedList = [
    {
      id: 1,
      title: "日常對話",
      image:
        "https://www.shutterstock.com/image-vector/students-sitting-having-conversation-600nw-2584238303.jpg",
      description: "學習常見日常手勢，提升表達流暢度",
    },
    {
      id: 2,
      title: "餐廳用語",
      image:
        "https://static.vecteezy.com/system/resources/previews/047/553/671/non_2x/a-yellow-and-red-building-with-a-red-awning-and-a-black-door-vector.jpg",
      description: "掌握餐廳常用手語，點餐更方便",
    },
    {
      id: 3,
      title: "交通出行",
      image:
        "https://goldcard.nat.gov.tw/cms-uploads/public-transportation-getting-around-taiwan.jpg",
      description: "學會出行相關手語，問路搭車更輕鬆",
    },
  ];

  const signOfTheDay = {
    word: "謝謝 (Thank you)",
    gif: "https://png.pngtree.com/element_our/20190602/ourlarge/pngtree-sign-language-thank-you-gesture-image_1419966.jpg",
  };

  return (
    <LinearGradient colors={["#F1F5FF", "#E8EEFF"]} style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.contentContainer,
          {
            paddingBottom: insets.bottom + tabBarHeight + 32, // 動態底部距
          },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        decelerationRate="fast"
      >
        {/* Header 歡迎 + Hero 區 */}
        <Image
          source={require("@/assets/images/hero.png")}
          resizeMode="contain"
          style={styles.headerImage}
        />
        <View style={styles.headerTextWrap}>
          <Text style={styles.greeting}>👋 Hi，{user.name}</Text>
          <Text style={styles.subtitleMuted}>今天再學一點點，就更接近目標</Text>
        </View>

        <LinearGradient colors={["#2563EB", "#1D4ED8"]} style={styles.heroCard}>
          <View style={{ flex: 1 }}>
            <Text style={styles.heroTitle}>
              繼續「{user.lastLesson.title}」
            </Text>
            <Text style={styles.heroSub}>
              上次：第 {user.lastLesson.volume} 冊 第 {user.lastLesson.unit}{" "}
              單元
            </Text>

            {/* 進度條重構 */}
            <View style={styles.progressBlock}>
              <ProgressBar
                progress={user.progress}
                color="#fff"
                style={styles.heroProgress}
              />
              <Text style={styles.heroProgressPercent}>
                {Math.round(user.progress * 100)}%
              </Text>
            </View>

            <Button
              mode="contained"
              buttonColor="#000"
              textColor="#fff"
              style={[styles.ctaButton, styles.blackButton]}
              onPress={() =>
                router.push(
                  `/education/teach/${user.lastLesson.volume}/${user.lastLesson.unit}`
                )
              }
            >
              繼續學習
            </Button>
          </View>
        </LinearGradient>

        {/* 快速功能 - 卡片整塊可點 */}
        <View style={styles.sectionHeader}>
          <View style={styles.sectionBar} />
          <Text style={styles.sectionTitle}>🧭 快速功能</Text>
        </View>
        <View style={styles.quickRow}>
          <TouchableOpacity
            activeOpacity={0.85}
            style={[styles.quickCard, styles.quickPrimary]}
            onPress={() => router.push("/translation")}
          >
            <Text style={styles.quickTitle}>即時翻譯</Text>
            <Text style={styles.quickDesc}>手語 ↔ 文字 / 語音</Text>
            <Button
              mode="contained"
              buttonColor="#1E40AF"
              style={styles.quickBtn}
              labelStyle={{ fontSize: 13 }}
            >
              開啟
            </Button>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.85}
            style={[styles.quickCard, styles.quickOutline]}
            onPress={() => router.push("/practice")}
          >
            <Text style={styles.quickTitle}>練習模式</Text>
            <Text style={styles.quickDesc}>專注複習已學內容</Text>
            <Button
              mode="contained"
              buttonColor="#000"
              textColor="#fff"
              style={[styles.quickBtn, styles.blackButton]}
              labelStyle={{ fontSize: 13 }}
            >
              進入
            </Button>
          </TouchableOpacity>
        </View>

        {/* 推薦課程 */}
        <View style={styles.sectionHeader}>
          <View style={styles.sectionBar} />
          <Text style={styles.sectionTitle}>📖 推薦課程</Text>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.recommendScrollContent}
          decelerationRate="fast"
          snapToAlignment="start"
          snapToInterval={240} // 220 寬 + 20 邊距
        >
          {recommendedList.map((item) => (
            <RecommendCard
              key={item.id}
              item={item}
              onPress={() => router.push("/education/teach-screen")}
            />
          ))}
        </ScrollView>

        {/* 每日一句 */}
        <View style={styles.sectionHeader}>
          <View style={styles.sectionBar} />
          <Text style={styles.sectionTitle}>✍️ 每日一句</Text>
        </View>
        <Card style={[styles.flatCard, styles.dailyCard]} mode="contained">
          <Card.Content style={styles.dailyContent}>
            <Text style={styles.dailyWord}>{signOfTheDay.word}</Text>
            <Image source={{ uri: signOfTheDay.gif }} style={styles.gif} />
            <Button
              compact
              mode="text"
              textColor="#1D4ED8"
              onPress={() => {}}
              style={{ marginTop: 6 }}
              labelStyle={{ fontSize: 13, fontWeight: "600" }}
            >
              更多例句
            </Button>
          </Card.Content>
        </Card>

        {/* 學習進度 */}
        <View style={styles.sectionHeader}>
          <View style={styles.sectionBar} />
          <Text style={styles.sectionTitle}>🏫 學習進度</Text>
        </View>
        <Card
          style={[styles.flatCard, styles.progressCardLite]}
          mode="contained"
        >
          <Card.Content style={styles.progressLiteContent}>
            <View style={styles.progressTopRow}>
              <Text style={styles.progressTitle}>本週完成度</Text>
              <Text style={styles.progressSub}>
                {user.weeklyCompleted}/{user.weeklyTarget}
              </Text>
            </View>

            <View style={styles.progressBarWrap}>
              <ProgressBar
                progress={user.progress}
                color="#1D4ED8"
                style={styles.progressBarLite}
              />
            </View>

            <View style={styles.progressBottomRow}>
              <Text style={styles.progressPercentLite}>
                {Math.round(user.progress * 100)}%
              </Text>
              <Button
                mode="contained"
                buttonColor="#000"
                textColor="#fff"
                style={styles.progressActionBtn}
                labelStyle={{ fontSize: 13, fontWeight: "600" }}
                onPress={() => router.push("/stats")}
              >
                查看詳細
              </Button>
            </View>
          </Card.Content>
        </Card>
      </ScrollView>
    </LinearGradient>
  );
}

const { width } = Dimensions.get("window");
const styles = StyleSheet.create({
  container: { flex: 1 },
  contentContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  headerImage: {
    width: width * 0.8,
    height: width * 0.8,
    maxHeight: 280,
    alignSelf: "center",
  },
  headerTextWrap: {
    marginVertical: 8,
  },
  greeting: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1E3A8A",
  },
  subtitleMuted: {
    fontSize: 13,
    color: "#64748B",
    marginTop: 2,
  },
  heroCard: {
    borderRadius: 24,
    padding: 20,
    marginBottom: 20,
    flexDirection: "row",
    overflow: "hidden",
  },
  heroTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 4,
  },
  heroSub: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 13,
    marginBottom: 12,
  },
  progressBlock: {
    marginBottom: 12,
    position: "relative",
  },
  heroProgress: {
    width: "100%",
    height: 12,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.25)",
  },
  heroProgressPercent: {
    position: "absolute",
    right: 8,
    top: "50%",
    transform: [{ translateY: -8 }],
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  ctaButton: {
    alignSelf: "flex-start",
    borderRadius: 14,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    marginTop: 4,
  },
  sectionBar: {
    width: 4,
    height: 18,
    backgroundColor: "#2563EB",
    borderRadius: 2,
    marginRight: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1E293B",
  },
  quickRow: {
    flexDirection: "row",
    gap: 12,
  },
  quickCard: {
    flex: 1,
    borderRadius: 22,
    padding: 18,
    backgroundColor: "#F1F5F9",
  },
  quickPrimary: {
    backgroundColor: "#EEF2FF",
  },
  quickOutline: {
    borderWidth: 1,
    borderColor: "#CBD5E1",
    backgroundColor: "#FFFFFF",
  },
  quickBtn: {
    marginTop: 14,
    borderRadius: 14,
  },
  recommendScrollContent: {
    paddingRight: 16,
    paddingVertical: 4,
  },

  recOuter: {
    width: 220,
    marginRight: 20,
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  recImageWrap: {
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    overflow: "hidden",
    width: "100%",
    aspectRatio: 16 / 9,
    backgroundColor: "#E2E8F0",
    position: "relative",
  },
  recImage: {
    width: "100%",
    height: "100%",
  },
  recSkeleton: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#E2E8F0",
  },
  recErrorBox: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  recErrorText: {
    fontSize: 11,
    color: "#DC2626",
    fontWeight: "600",
  },
  recOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 10,
    paddingTop: 24,
    paddingBottom: 6,
    justifyContent: "flex-end",
  },
  recTitle: {
    color: "#FFF",
    fontSize: 15,
    fontWeight: "700",
  },
  recBody: {
    paddingHorizontal: 12,
    paddingTop: 8,
    minHeight: 70,
  },
  recLinkBtn: {
    position: "absolute",
    right: 12,
    bottom: 10,
    fontSize: 13,
    fontWeight: "600",
    color: "#2563EB",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: "#EEF2FF",
  },

  recDesc: {
    fontSize: 12,
    color: "#475569",
    lineHeight: 16,
    marginBottom: 6, // 只留一點間距
  },

  recLink: {
    alignSelf: "flex-start",
    fontSize: 13,
    fontWeight: "600",
    color: "#2563EB",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    backgroundColor: "#EEF2FF", // 小圓角背景更像按鈕
    overflow: "hidden",
  },

  /* Daily card 調淡，移除邊框 */
  dailyCard: {
    backgroundColor: "#F3F8FF",
  },
  dailyContent: {
    alignItems: "center",
    paddingVertical: 14,
  },
  dailyWord: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 10,
    color: "#1E3A8A",
  },

  /* 進度卡（淺藍） */
  progressCardLite: {
    backgroundColor: "#E4EDFF",
  },
  progressLiteContent: {
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 18,
  },
  progressTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: 10,
  },
  progressTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1E3A8A",
  },
  progressSub: {
    fontSize: 12,
    color: "#475569",
    fontWeight: "500",
  },
  progressBarWrap: {
    marginBottom: 14,
  },
  progressBarLite: {
    height: 12,
    borderRadius: 8,
    backgroundColor: "#C7DAFF",
  },
  progressBottomRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  progressPercentLite: {
    fontSize: 26,
    fontWeight: "700",
    color: "#1E3A8A",
  },
  progressActionBtn: {
    borderRadius: 18,
    paddingHorizontal: 18,
    height: 40,
    justifyContent: "center",
  },
});

function RecommendCard({ item, onPress }) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onPress}
      style={styles.recOuter}
    >
      <View style={styles.recImageWrap}>
        {!loaded && !error && <View style={styles.recSkeleton} />}
        {error ? (
          <View style={styles.recErrorBox}>
            <Text style={styles.recErrorText}>載入失敗</Text>
          </View>
        ) : (
          <Image
            source={{ uri: item.image.replace(".gif", ".png") }}
            style={styles.recImage}
            resizeMode="cover"
            onLoad={() => setLoaded(true)}
            onError={() => setError(true)}
          />
        )}
        <LinearGradient
          colors={["rgba(0,0,0,0)", "rgba(0,0,0,0.55)"]}
          style={styles.recOverlay}
        >
          <Text style={styles.recTitle} numberOfLines={1}>
            {item.title}
          </Text>
        </LinearGradient>
      </View>
      <View style={styles.recBody}>
        <Text style={styles.recDesc} numberOfLines={2}>
          {item.description}
        </Text>
        <Text style={styles.recLinkBtn}>查看</Text>
      </View>
    </TouchableOpacity>
  );
}
