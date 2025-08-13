import { Stack, usePathname } from 'expo-router';

export default function Layout() {
  const pathname = usePathname();
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: pathname.startsWith('/translation') ? 'default' : 'none',
      }}
    />
  );
}
