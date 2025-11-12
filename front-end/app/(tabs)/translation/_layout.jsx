import { Stack, usePathname } from 'expo-router';
import { useColorScheme } from 'react-native';

export default function Layout() {
  const pathname = usePathname();
  const colorScheme = useColorScheme();

  const THEME = {
    light: {
      primary: '#6750A4',
      surface: '#FFFBFE',
      onSurface: '#1C1B1F',
      surfaceContainer: '#F3EDF7',
    },
    dark: {
      primary: '#D0BCFF',
      surface: '#141218',
      onSurface: '#E6E0E9',
      surfaceContainer: '#211F26',
    },
  };

  const theme = THEME[colorScheme] || THEME.light;

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        animationDuration: 300,
        gestureEnabled: true,
        cardStyle: {
          backgroundColor: theme.surface,
        },
        headerStyle: {
          backgroundColor: theme.surface,
        },
        headerTintColor: theme.onSurface,
      }}
    />
  );
}
