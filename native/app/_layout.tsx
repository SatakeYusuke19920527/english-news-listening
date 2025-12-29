import { Stack, Slot } from 'expo-router';
import { Provider } from 'react-redux';
import { store } from '../store/store';
import * as Notifications from 'expo-notifications';
import { ClerkProvider } from '@clerk/clerk-expo';
import { tokenCache } from '@clerk/clerk-expo/token-cache';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export default function RootLayout() {
  return (
    <ClerkProvider tokenCache={tokenCache}>
      <Provider store={store}>
        <Stack
          screenOptions={{
            headerTitleStyle: {
              fontFamily: 'Avenir Next',
              fontWeight: '600',
            },
            headerShadowVisible: false,
          }}
        >
          <Stack.Screen
            name="(tabs)"
            options={{ headerShown: false, title: '' }}
          />
          <Stack.Screen
            name="news/[id]"
            options={{
              title: 'Article',
              headerBackTitle: '',
              headerBackTitleStyle: { fontSize: 1 },
            }}
          />
        </Stack>
      </Provider>
    </ClerkProvider>
  );
}
