import { useAuth, useOAuth, useUser } from '@clerk/clerk-expo';
import * as WebBrowser from 'expo-web-browser';
import React from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { selectNews } from '../../features/newsSlice';
import {
  selectLevel,
  selectNewsSources,
  setNewsSources,
  selectNotificationsEnabled,
  setLevel,
  setNewsSourceEnabled,
  setNotificationsEnabled,
} from '../../features/settingsSlice';
import { useAppDispatch, useAppSelector } from '../../hooks/useRTK';
import { pickContentByLevel } from '../../lib/newsApi';
import {
  cancelDailyNewsNotifications,
  ensureNotificationPermissions,
  scheduleDailyNewsNotification,
} from '../../lib/notifications';
import { NewsSource } from '../../types/type';

const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as const;
const NEWS_SOURCES: NewsSource[] = [
  'Google',
  'OpenAI',
  'Anthropic',
  'Mistral AI',
  'Microsoft',
  'AWS',
];

const USER_SETTINGS_URL = 'https://func-english-news-listening-f3ecbfe6hqc0chgt.eastus-01.azurewebsites.net/api/user-news-settings';

export default function SettingScreen() {
  const dispatch = useAppDispatch();
  const level = useAppSelector(selectLevel);
  const notificationsEnabled = useAppSelector(selectNotificationsEnabled);
  const newsSources = useAppSelector(selectNewsSources);
  const { news } = useAppSelector(selectNews);
  const { isSignedIn, user } = useUser();
  const { getToken } = useAuth();
  const { startOAuthFlow } = useOAuth({ strategy: 'oauth_google' });
  const primaryEmail = user?.primaryEmailAddress?.emailAddress;
  const displayName =
    primaryEmail ?? user?.username ?? user?.fullName ?? 'Member';
  const userId = user?.id;
  WebBrowser.maybeCompleteAuthSession();
  const handleGoogleSignIn = async () => {
    try {
      const { createdSessionId, setActive } = await startOAuthFlow();
      if (createdSessionId && setActive) {
        await setActive({ session: createdSessionId });
      }
    } catch (err) {
      console.error(JSON.stringify(err, null, 2));
    }
  };

  const fetchUserNewsSources = React.useCallback(async () => {
    if (!userId) return;
    try {
      const response = await fetch(
        `${USER_SETTINGS_URL}?userId=${encodeURIComponent(userId)}`
      );
      if (!response.ok) return;
      const payload = await response.json();
      if (!payload?.company) return;
      const company = payload.company;
      const nextSources = {
        Google: Boolean(company.Google),
        OpenAI: Boolean(company.OpenAI),
        Anthropic: Boolean(company.Anthropic),
        'Mistral AI': Boolean(company.MistralAI),
        Microsoft: Boolean(company.Microsoft),
        AWS: Boolean(company.AWS),
      } as const;
      dispatch(setNewsSources(nextSources));
    } catch (err) {
      console.error(JSON.stringify(err, null, 2));
    }
  }, [dispatch, userId]);

  React.useEffect(() => {
    if (!isSignedIn || !userId) return;
    void fetchUserNewsSources();
  }, [fetchUserNewsSources, isSignedIn, userId]);

  const saveNewsSources = React.useCallback(
    async (sources: Record<NewsSource, boolean>) => {
      if (!userId) return;
      try {
        const token = await getToken();
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
        };
        if (token) {
          headers.Authorization = `Bearer ${token}`;
        }
        await fetch(USER_SETTINGS_URL, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            userId,
            Google: sources['Google'],
            OpenAI: sources['OpenAI'],
            Anthropic: sources['Anthropic'],
            MistralAI: sources['Mistral AI'],
            Microsoft: sources['Microsoft'],
            AWS: sources['AWS'],
          }),
        });
      } catch (err) {
        console.error(JSON.stringify(err, null, 2));
      }
    },
    [getToken, userId]
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>Settings</Text>
        <Text style={styles.subtitle}>Personalize your learning pace.</Text>
      </View>

      <View style={styles.loginCard}>
        <View>
          <Text style={styles.loginTitle}>
            {isSignedIn ? 'Signed in' : 'Not signed in'}
          </Text>
          <Text style={styles.loginBody}>
            {isSignedIn
              ? `Signed in as ${displayName}.`
              : 'Sign in to sync your level and saved articles across devices.'}
          </Text>
        </View>
        {!isSignedIn && (
          <Pressable style={styles.loginButton} onPress={handleGoogleSignIn}>
            <Text style={styles.loginButtonText}>Sign in</Text>
          </Pressable>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>English level</Text>
        <Text style={styles.sectionHint}>
          Choose the CEFR level for your generated summaries.
        </Text>
        <View style={styles.levelGrid}>
          {LEVELS.map((item) => {
            const isActive = item === level;
            return (
              <Pressable
                key={item}
                onPress={() => dispatch(setLevel(item))}
                style={[styles.levelChip, isActive && styles.levelChipActive]}
              >
                <Text
                  style={[
                    styles.levelChipText,
                    isActive && styles.levelChipTextActive,
                  ]}
                >
                  {item}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Playback</Text>
        <View style={styles.preferenceCard}>
          <View>
            <Text style={styles.preferenceTitle}>Voice speed</Text>
            <Text style={styles.preferenceBody}>
              Balanced for comprehension
            </Text>
          </View>
          <Text style={styles.preferenceValue}>1.0x</Text>
        </View>
        <View style={styles.preferenceCard}>
          <View>
            <Text style={styles.preferenceTitle}>Auto play on open</Text>
            <Text style={styles.preferenceBody}>
              Start reading aloud automatically
            </Text>
          </View>
          <Text style={styles.preferenceValue}>Off</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Notifications</Text>
        <View style={styles.preferenceCard}>
          <View>
            <Text style={styles.preferenceTitle}>Daily 1:00 AM</Text>
            <Text style={styles.preferenceBody}>
              Get a daily brief with the latest summary.
            </Text>
          </View>
          <Switch
            value={notificationsEnabled}
            onValueChange={async (value) => {
              if (value) {
                const granted = await ensureNotificationPermissions();
                if (!granted) return;
                await scheduleDailyNewsNotification(
                  getLatestSummary(news, level)
                );
                dispatch(setNotificationsEnabled(true));
                return;
              }
              await cancelDailyNewsNotifications();
              dispatch(setNotificationsEnabled(false));
            }}
            trackColor={{ true: '#FF385C', false: '#E5E7EB' }}
            thumbColor="#FFFFFF"
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>News sources</Text>
        {NEWS_SOURCES.map((source) => (
          <View key={source} style={styles.preferenceCard}>
            <Text style={styles.preferenceTitle}>{source}</Text>
            <Switch
              value={newsSources[source]}
              onValueChange={(value) => {
                const nextSources = { ...newsSources, [source]: value };
                dispatch(setNewsSourceEnabled({ source, enabled: value }));
                void saveNewsSources(nextSources);
              }}
              trackColor={{ true: '#FF385C', false: '#E5E7EB' }}
              thumbColor="#FFFFFF"
            />
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  content: {
    paddingBottom: 32,
    paddingTop: 12,
  },
  header: {
    paddingTop: 0,
    paddingHorizontal: 20,
  },
  title: {
    fontFamily: 'Georgia',
    fontSize: 30,
    color: '#111827',
  },
  subtitle: {
    fontFamily: 'Avenir Next',
    fontSize: 14,
    color: '#6B7280',
    marginTop: 6,
  },
  loginCard: {
    marginTop: 10,
    marginHorizontal: 20,
    padding: 18,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F3F4F6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  loginTitle: {
    fontFamily: 'Avenir Next',
    fontSize: 16,
    color: '#111827',
    fontWeight: '600',
    marginBottom: 6,
  },
  loginBody: {
    fontFamily: 'Avenir Next',
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
    maxWidth: 220,
  },
  loginButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 14,
    backgroundColor: '#FF385C',
  },
  loginButtonText: {
    fontFamily: 'Avenir Next',
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  section: {
    marginTop: 28,
    paddingHorizontal: 20,
  },
  sectionLabel: {
    fontFamily: 'Georgia',
    fontSize: 20,
    color: '#111827',
  },
  sectionHint: {
    fontFamily: 'Avenir Next',
    fontSize: 13,
    color: '#6B7280',
    marginTop: 6,
  },
  levelGrid: {
    marginTop: 16,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  levelChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  levelChipActive: {
    backgroundColor: '#FF385C',
    borderColor: '#FF385C',
  },
  levelChipText: {
    fontFamily: 'Avenir Next',
    fontSize: 13,
    color: '#111827',
    fontWeight: '600',
  },
  levelChipTextActive: {
    color: '#FFFFFF',
  },
  preferenceCard: {
    marginTop: 12,
    padding: 16,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F3F4F6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  preferenceTitle: {
    fontFamily: 'Avenir Next',
    fontSize: 14,
    color: '#111827',
    fontWeight: '600',
  },
  preferenceBody: {
    fontFamily: 'Avenir Next',
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  preferenceValue: {
    fontFamily: 'Avenir Next',
    fontSize: 13,
    color: '#FF385C',
    fontWeight: '600',
  },
});

function getLatestSummary(
  news: { id: string; content: string }[],
  level: string
) {
  if (!news.length) return 'No new stories yet. Check back soon.';
  const latest = news[0];
  const text = pickContentByLevel(latest as any, level);
  return text.length > 140 ? `${text.slice(0, 140).trim()}…` : text;
}
