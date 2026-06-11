import { useColorScheme } from 'react-native';
import { lightColors, darkColors, ThemeColors } from './theme';

export function useThemeColors(): ThemeColors {
  const colorScheme = useColorScheme();
  return colorScheme === 'dark' ? darkColors : lightColors;
}
