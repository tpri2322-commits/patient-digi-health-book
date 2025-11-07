import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { Provider as PaperProvider, DefaultTheme } from 'react-native-paper';
import { colors } from './src/constants/theme';
import AppNavigator from './src/navigation/AppNavigator';

const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: colors.primary,
    accent: colors.accent,
    secondary: colors.secondary,
    background: colors.background,
    surface: colors.surface,
    text: colors.textPrimary,
    onSurface: colors.textPrimary,
    disabled: colors.textDisabled,
    placeholder: colors.textSecondary,
    backdrop: 'rgba(0, 0, 0, 0.5)',
    notification: colors.error,
    onPrimary: colors.textOnPrimary,
    onBackground: colors.textPrimary,
    onAccent: colors.textOnPrimary,
    // Additional colors for components
    secondaryContainer: colors.primary,
    onSecondaryContainer: colors.textOnPrimary,
    outline: colors.border,
    outlineVariant: colors.border,
  },
};

export default function App() {
  return (
    <PaperProvider theme={theme}>
      <NavigationContainer>
        <AppNavigator />
      </NavigationContainer>
    </PaperProvider>
  );
}

