import { SignedIn, SignedOut, useUser } from "@clerk/clerk-expo";
import { Link } from "expo-router";
import { Text, View } from "react-native";
import { SignOutButton } from "@/components/SignOutButton";

export default function Page() {
  const { user } = useUser();

  return (
    <View className="flex-1 justify-center items-center bg-red-100">
      <SignedIn>
        <Text className="text-red-800 font-bold">
          Hello, {user?.emailAddresses[0].emailAddress}
        </Text>
        <SignOutButton />
      </SignedIn>
      <SignedOut>
        <Link href="/(auth)/sign-in">
          <Text>登入</Text>
        </Link>
        <Link href="/(auth)/sign-up">
          <Text>註冊</Text>
        </Link>
      </SignedOut>
    </View>
  );
}
