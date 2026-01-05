import { Link } from 'expo-router';
import { useUser } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useMemo, useRef } from 'react';
import {
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
  ImageBackground,
} from 'react-native';
import { LoadingPing } from '../../components/LoadingPing';
import { loadNewsList, selectNews } from '../../features/newsSlice';
import { selectLevel } from '../../features/settingsSlice';
import { useAppDispatch, useAppSelector } from '../../hooks/useRTK';
import { pickContentByLevel } from '../../lib/newsApi';

export default function HomeScreen() {
  const dispatch = useAppDispatch();
  const { news, status, error } = useAppSelector(selectNews);
  const level = useAppSelector(selectLevel);
  const todayLabel = useMemo(() => {
    const today = new Date();
    return today.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  }, []);

  const { user } = useUser();
  const userId = user?.id;
  const lastUserId = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (status === 'idle' || lastUserId.current !== userId) {
      dispatch(loadNewsList(userId));
      lastUserId.current = userId;
    }
  }, [dispatch, status, userId]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <StatusBar barStyle="dark-content" />
      <ImageBackground
        source={{
          uri: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=1600&q=80',
        }}
        style={styles.hero}
        imageStyle={styles.heroImage}
      >
        <View style={styles.heroOverlay} />
        <View style={styles.heroContent}>
          <Text style={styles.appTitle}>AI News Listening</Text>
          <Text style={styles.heroHeadline}>
            Listen to today&apos;s news in English!
          </Text>
          <Text style={styles.heroSubhead}>
            Your daily AI brief, tuned to your English level.
          </Text>
          <View style={styles.heroRow}>
            <View style={styles.levelPill}>
              <Text style={styles.levelLabel}>Level</Text>
              <Text style={styles.levelValue}>{level}</Text>
            </View>
          </View>
        </View>
      </ImageBackground>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>🗞️ Weekly News</Text>
        <Pressable
          style={styles.syncButton}
          onPress={() => dispatch(loadNewsList(userId))}
        >
          <Ionicons name="sync" size={16} color="#FF385C" />
          <Text style={styles.syncText}>Sync</Text>
        </Pressable>
      </View>

      <View style={styles.list}>
        {status === 'loading' ? <LoadingPing /> : null}
        {status === 'failed' ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>Unable to load news</Text>
            <Text style={styles.emptyBody}>{error ?? 'Please try again.'}</Text>
          </View>
        ) : null}
        {news.map((item) => (
          <Link key={item.id} href={`/news/${item.id}`} asChild>
            <Pressable style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTag}>
                  {item.company ?? 'AI'}
                </Text>
              </View>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.cardSummary}>
                {truncateText(pickContentByLevel(item, level), 120)}
              </Text>
              <View style={styles.cardFooter}>
                <Text style={styles.cardLink}>Open →</Text>
              </View>
            </Pressable>
          </Link>
        ))}
      </View>
    </ScrollView>
  );
}

function truncateText(text: string, maxLength: number) {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength).trim()}…`;
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  content: {
    paddingBottom: 32,
  },
  hero: {
    paddingHorizontal: 20,
    paddingTop: 36,
    paddingBottom: 28,
    overflow: 'hidden',
  },
  heroImage: {
    resizeMode: 'cover',
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
  },
  heroContent: {
    position: 'relative',
  },
  heroGlow: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: '#FFDDE3',
    top: -60,
    right: -40,
    opacity: 0.9,
  },
  heroGlowSecondary: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: '#E8F3FF',
    bottom: -60,
    left: -30,
    opacity: 0.9,
  },
  appTitle: {
    fontFamily: 'Avenir Next',
    fontSize: 14,
    textTransform: 'uppercase',
    letterSpacing: 2,
    color: '#E2E8F0',
    marginBottom: 12,
  },
  heroHeadline: {
    fontFamily: 'Georgia',
    fontSize: 30,
    color: '#F8FAFC',
    marginBottom: 12,
  },
  heroSubhead: {
    fontFamily: 'Avenir Next',
    fontSize: 16,
    lineHeight: 22,
    color: '#E2E8F0',
    marginBottom: 20,
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  levelPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    borderWidth: 1,
    borderColor: 'rgba(248, 250, 252, 0.35)',
  },
  levelLabel: {
    fontFamily: 'Avenir Next',
    fontSize: 12,
    color: '#E2E8F0',
  },
  levelValue: {
    fontFamily: 'Avenir Next',
    fontSize: 14,
    color: '#F8FAFC',
    fontWeight: '600',
  },
  sectionHeader: {
    marginTop: 24,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  syncButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: '#FFE5EA',
  },
  syncText: {
    fontFamily: 'Avenir Next',
    fontSize: 12,
    color: '#FF385C',
    fontWeight: '600',
  },
  sectionTitle: {
    fontFamily: 'Georgia',
    fontSize: 22,
    color: '#111827',
  },
  sectionSubtitle: {
    fontFamily: 'Avenir Next',
    fontSize: 13,
    color: '#6B7280',
    marginTop: 4,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: '#FF385C',
  },
  filterText: {
    fontFamily: 'Avenir Next',
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  list: {
    marginTop: 18,
    paddingHorizontal: 20,
    gap: 14,
  },
  emptyCard: {
    padding: 16,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  emptyTitle: {
    fontFamily: 'Avenir Next',
    fontSize: 14,
    color: '#111827',
    fontWeight: '600',
    marginBottom: 6,
  },
  emptyBody: {
    fontFamily: 'Avenir Next',
    fontSize: 12,
    color: '#6B7280',
  },
  card: {
    padding: 16,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    shadowColor: '#111827',
    shadowOpacity: 0.08,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  cardTag: {
    fontFamily: 'Avenir Next',
    fontSize: 11,
    color: '#FF385C',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  cardDate: {
    fontFamily: 'Avenir Next',
    fontSize: 11,
    color: '#9CA3AF',
  },
  cardTitle: {
    fontFamily: 'Georgia',
    fontSize: 17,
    color: '#111827',
    marginBottom: 8,
  },
  cardSummary: {
    fontFamily: 'Avenir Next',
    fontSize: 13,
    color: '#4B5563',
    lineHeight: 18,
  },
  cardFooter: {
    marginTop: 12,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
  },
  cardSource: {
    fontFamily: 'Avenir Next',
    fontSize: 12,
    color: '#6B7280',
  },
  cardLink: {
    fontFamily: 'Avenir Next',
    fontSize: 12,
    color: '#FF385C',
    fontWeight: '600',
  },
});
