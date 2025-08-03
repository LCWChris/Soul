import { Stack, usePathname } from "expo-router";

export default function _layout() {
  const pathname = usePathname();
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: pathname.startsWith("/") ? "default" : "none",
      }}
    />
  );
}
