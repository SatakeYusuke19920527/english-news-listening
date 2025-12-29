import { useOAuth } from '@clerk/clerk-expo';
import * as WebBrowser from 'expo-web-browser';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

WebBrowser.maybeCompleteAuthSession();

export default function Page() {
  const { startOAuthFlow } = useOAuth({ strategy: 'oauth_google' });

  const onGooglePress = React.useCallback(async () => {
    try {
      const { createdSessionId, setActive } = await startOAuthFlow();
      if (createdSessionId) {
        await setActive({ session: createdSessionId });
      }
    } catch (err) {
      console.error(JSON.stringify(err, null, 2));
    }
  }, [startOAuthFlow]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Sign in</Text>
      <Text style={styles.body}>
        Continue with your Google account to sync your progress.
      </Text>
      <Pressable style={styles.googleButton} onPress={onGooglePress}>
        <Text style={styles.googleButtonText}>Continue with Google</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 24,
    paddingTop: 40,
  },
  title: {
    fontFamily: 'Georgia',
    fontSize: 28,
    color: '#111827',
  },
  body: {
    fontFamily: 'Avenir Next',
    fontSize: 14,
    color: '#6B7280',
    marginTop: 10,
    marginBottom: 24,
  },
  googleButton: {
    borderRadius: 14,
    backgroundColor: '#111827',
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  googleButtonText: {
    fontFamily: 'Avenir Next',
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
