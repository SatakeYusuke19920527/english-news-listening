import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { selectLevel, setLevel } from '../../features/settingsSlice';
import { useAppDispatch, useAppSelector } from '../../hooks/useRTK';

const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as const;

export default function SettingScreen() {
  const dispatch = useAppDispatch();
  const level = useAppSelector(selectLevel);
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 36 }]}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Settings</Text>
        <Text style={styles.subtitle}>Personalize your learning pace.</Text>
      </View>

      <View style={styles.loginCard}>
        <View>
          <Text style={styles.loginTitle}>Not signed in</Text>
          <Text style={styles.loginBody}>
            Sign in to sync your level and saved articles across devices.
          </Text>
        </View>
        <Pressable style={styles.loginButton}>
          <Text style={styles.loginButtonText}>Sign in</Text>
        </Pressable>
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
