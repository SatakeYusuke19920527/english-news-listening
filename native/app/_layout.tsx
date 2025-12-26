import { Stack } from 'expo-router';
import { Provider } from 'react-redux';
import { store } from '../store/store';

export default function RootLayout() {
  return (
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
  );
}
