import { SignedIn, useUser } from "@clerk/clerk-expo";
import { Link } from "expo-router";
import { Text, TouchableOpacity, View } from "react-native";

export default function Page() {
  const { user } = useUser();

  return (
    <View className="flex-1 justify-center items-center bg-red-100">
      <SignedIn>
        <Text className="text-red-800 font-bold">
          Hello, {user?.username || user?.emailAddresses[0]?.emailAddress}
        </Text>
        <Link href="HomeScreenTest" push asChild>
          <TouchableOpacity className="mt-4 bg-red-500 px-4 py-2 rounded">
            <Text>跳轉測試頁面</Text>
          </TouchableOpacity>
        </Link>
      </SignedIn>
    </View>
  );
}
