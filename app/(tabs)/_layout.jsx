import { COLORS } from "@/constants/theme";
import { useUser } from "@clerk/clerk-expo";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { Redirect, Tabs } from "expo-router";

export default function TabLayout() {
  const { isSignedIn } = useUser();

  if (!isSignedIn) return <Redirect href={"/sign-in"} />; // 如果未登入，重定向到登入頁面

  return (
    <Tabs
      screenOptions={{
        tabBarShowLabel: false,
        headerShown: false,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.gray,
        tabBarStyle: {
          backgroundColor: COLORS.tabBarColor,
          borderTopWidth: 0,
          elevation: 1, // Android 上的陰影
          shadowColor: COLORS.shadow, // iOS 上的陰影
          position: "absolute", // 使 TabBar 固定在底部
          height: 40,
          paddingBottom: 8, // 調整底部填充以適應圖標
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "首頁",
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons
              name="home-variant-outline"
              color={color}
              size={24}
            />
          ),
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="education"
        options={{
          title: "學習",
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons
              name="book-open-page-variant-outline"
              color={color}
              size={24}
            />
          ),
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="translation"
        options={{
          title: "翻譯",
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons
              name="hand-wave-outline"
              color={color}
              size={22}
            />
          ),
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="user"
        options={{
          title: "使用者",
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons
              name="account-outline"
              color={color}
              size={24}
            />
          ),
          headerShown: false,
        }}
      />
    </Tabs>
  );
}
