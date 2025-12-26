import { useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import * as Speech from 'expo-speech';
import { CosmosNewsItem } from '../../types/type';
import { fetchNewsDetail, pickContentByLevel } from '../../lib/newsApi';
import { useAppSelector } from '../../hooks/useRTK';
import { selectLevel } from '../../features/settingsSlice';
import { LoadingPing } from '../../components/LoadingPing';

export default function NewsDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [isPlaying, setIsPlaying] = useState(false);
  const [item, setItem] = useState<CosmosNewsItem | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const level = useAppSelector(selectLevel);

  useEffect(() => {
    if (!id) return;
    let isMounted = true;

    fetchNewsDetail(id)
      .then((data) => {
        if (!isMounted) return;
        setItem(data);
        setErrorMessage(null);
      })
      .catch((error: Error) => {
        if (!isMounted) return;
        setItem(null);
        setErrorMessage(error.message);
      });

    return () => {
      isMounted = false;
    };
  }, [id]);

  const article = useMemo(() => item, [item]);

  useEffect(() => {
    return () => {
      Speech.stop();
    };
  }, []);

  const spokenText = useMemo(() => {
    if (!article) return '';
    return pickContentByLevel(article, level);
  }, [article, level]);

  const handleToggleSpeech = () => {
    if (!spokenText) return;
    if (isPlaying) {
      Speech.stop();
      setIsPlaying(false);
      return;
    }

    setIsPlaying(true);
    Speech.speak(spokenText, {
      language: 'en-US',
      onDone: () => setIsPlaying(false),
      onStopped: () => setIsPlaying(false),
      onError: () => setIsPlaying(false),
    });
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.hero}>
        <Text style={styles.levelLabel}>Your level · {level}</Text>
        <Text style={styles.title}>{article?.title ?? 'Loading...'}</Text>
        {article ? (
          <View style={styles.metaRow}>
            <Text style={styles.metaText}>OpenAI</Text>
            <Text style={styles.metaDot}>•</Text>
            <Text style={styles.metaText}>
              {formatDate(article.date ?? article.fetchedAt)}
            </Text>
          </View>
        ) : null}
      </View>

      <View style={styles.listenCard}>
        <View>
          <Text style={styles.listenTitle}>Listen to the summary</Text>
          <Text style={styles.listenBody}>
            Built-in TTS will read the generated English aloud.
          </Text>
        </View>
        <Pressable
          onPress={handleToggleSpeech}
          style={[styles.listenButton, isPlaying && styles.listenButtonActive]}
        >
          <Text
            style={[styles.listenButtonText, isPlaying && styles.listenButtonTextActive]}
          >
            {isPlaying ? 'Stop' : 'Play'}
          </Text>
        </Pressable>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Generated English</Text>
        <View style={styles.generatedCard}>
          <Text style={styles.generatedText}>
            {article ? spokenText : errorMessage ? errorMessage : ''}
          </Text>
          {!article && !errorMessage ? <LoadingPing /> : null}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Keywords</Text>
        <View style={styles.bulletCard}>
          <View style={styles.keywordRow}>
            <Text style={styles.keywordChip}>frontier models</Text>
            <Text style={styles.keywordChip}>data curation</Text>
            <Text style={styles.keywordChip}>open tooling</Text>
          </View>
          <View style={styles.keywordRow}>
            <Text style={styles.keywordChip}>reasoning</Text>
            <Text style={styles.keywordChip}>collaboration</Text>
            <Text style={styles.keywordChip}>deployment</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Grammar</Text>
        <View style={styles.bulletCard}>
          <Text style={styles.grammarTitle}>1) Present continuous for trends</Text>
          <Text style={styles.grammarBody}>
            “are narrowing the gap” shows an ongoing change, not a finished result.
          </Text>
          <Text style={styles.grammarTitle}>2) By + gerund to explain method</Text>
          <Text style={styles.grammarBody}>
            “By curating data more carefully” explains the process that enables the
            result.
          </Text>
          <Text style={styles.grammarTitle}>3) Relative clauses for added detail</Text>
          <Text style={styles.grammarBody}>
            “which could reshape how quickly…” adds extra information about impact.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
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
    paddingTop: 24,
    paddingHorizontal: 20,
  },
  levelLabel: {
    fontFamily: 'Avenir Next',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1.6,
    color: '#6B7280',
    marginBottom: 12,
  },
  title: {
    fontFamily: 'Georgia',
    fontSize: 26,
    color: '#141414',
    marginBottom: 12,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metaText: {
    fontFamily: 'Avenir Next',
    fontSize: 12,
    color: '#6B7280',
  },
  metaDot: {
    fontFamily: 'Avenir Next',
    fontSize: 12,
    color: '#9CA3AF',
  },
  listenCard: {
    marginTop: 20,
    marginHorizontal: 20,
    padding: 16,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F3F4F6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  listenTitle: {
    fontFamily: 'Avenir Next',
    fontSize: 14,
    color: '#111827',
    fontWeight: '600',
  },
  listenBody: {
    fontFamily: 'Avenir Next',
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
    maxWidth: 220,
  },
  listenButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 14,
    backgroundColor: '#FF385C',
  },
  listenButtonActive: {
    backgroundColor: '#EF4444',
  },
  listenButtonText: {
    fontFamily: 'Avenir Next',
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  listenButtonTextActive: {
    color: '#FFFFFF',
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontFamily: 'Georgia',
    fontSize: 20,
    color: '#111827',
    marginBottom: 10,
  },
  generatedCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  generatedText: {
    fontFamily: 'Avenir Next',
    fontSize: 15,
    lineHeight: 22,
    color: '#374151',
  },
  bulletCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    gap: 8,
  },
  keywordRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  keywordChip: {
    fontFamily: 'Avenir Next',
    fontSize: 12,
    color: '#FF385C',
    backgroundColor: '#FFE4E6',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    overflow: 'hidden',
  },
  grammarTitle: {
    fontFamily: 'Avenir Next',
    fontSize: 13,
    color: '#111827',
    fontWeight: '600',
  },
  grammarBody: {
    fontFamily: 'Avenir Next',
    fontSize: 13,
    color: '#4B5563',
    lineHeight: 18,
    marginBottom: 6,
  },
});
