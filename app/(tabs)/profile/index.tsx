import React, { useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  User,
  Shield,
  Info,
  Trash2,
  ChevronRight,
  Heart,
  Brain,
  Crosshair,
  RotateCcw,
} from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useGame } from '@/providers/GameProvider';
import { formatAccuracy } from '@/utils/scoring';

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { progress, totalSessionsCount, overallAccuracy, resetState } = useGame();

  const handleResetData = useCallback(() => {
    const doReset = async () => {
      await resetState();
    };

    if (Platform.OS === 'web') {
      if (confirm('Это навсегда удалит все данные тренировок. Продолжить?')) {
        doReset();
      }
    } else {
      Alert.alert(
        'Сброс данных',
        'Это навсегда удалит все ваши тренировочные сессии и прогресс. Действие нельзя отменить.',
        [
          { text: 'Отмена', style: 'cancel' },
          { text: 'Сбросить', style: 'destructive', onPress: doReset },
        ]
      );
    }
  }, [resetState]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={styles.avatarCircle}>
            <User size={36} color={Colors.accent} />
          </View>
          <Text style={styles.name}>Хирург</Text>
          <Text style={styles.role}>Когнитивная тренировка</Text>
        </View>

        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryValue, { color: Colors.accent }]}>
                {totalSessionsCount}
              </Text>
              <Text style={styles.summaryLabel}>Сессии</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryValue, { color: Colors.secondary }]}>
                {totalSessionsCount > 0 ? formatAccuracy(overallAccuracy) : '--'}
              </Text>
              <Text style={styles.summaryLabel}>Точность</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryValue, { color: Colors.tertiary }]}>
                {progress['find-exact'].currentDifficulty + progress['restore-horizon'].currentDifficulty}
              </Text>
              <Text style={styles.summaryLabel}>Общий ур.</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Прогресс модулей</Text>
          <View style={styles.moduleRow}>
            <View style={[styles.moduleIcon, { backgroundColor: Colors.accentDim }]}>
              <Crosshair size={18} color={Colors.accent} />
            </View>
            <View style={styles.moduleContent}>
              <Text style={styles.moduleName}>Найди точный</Text>
              <Text style={styles.moduleDetail}>
                Уровень {progress['find-exact'].currentDifficulty} · {progress['find-exact'].totalSessions} сессий
              </Text>
            </View>
            <ChevronRight size={18} color={Colors.textTertiary} />
          </View>
          <View style={styles.moduleRow}>
            <View style={[styles.moduleIcon, { backgroundColor: Colors.secondaryDim }]}>
              <RotateCcw size={18} color={Colors.secondary} />
            </View>
            <View style={styles.moduleContent}>
              <Text style={styles.moduleName}>Восстанови горизонт</Text>
              <Text style={styles.moduleDetail}>
                Уровень {progress['restore-horizon'].currentDifficulty} · {progress['restore-horizon'].totalSessions} сессий
              </Text>
            </View>
            <ChevronRight size={18} color={Colors.textTertiary} />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>О приложении</Text>
          <MenuItem icon={<Brain size={18} color={Colors.textSecondary} />} label="Как это работает" />
          <MenuItem icon={<Shield size={18} color={Colors.textSecondary} />} label="Политика конфиденциальности" />
          <MenuItem icon={<Info size={18} color={Colors.textSecondary} />} label="Версия 1.0.0" showChevron={false} />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Данные</Text>
          <TouchableOpacity style={styles.menuItem} onPress={handleResetData} testID="reset-data">
            <Trash2 size={18} color={Colors.error} />
            <Text style={[styles.menuLabel, { color: Colors.error }]}>Сбросить все данные</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <View style={styles.footerRow}>
            <Heart size={14} color={Colors.textTertiary} />
            <Text style={styles.footerText}>SurgiCoach — Тренируй хирургическое мышление</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

function MenuItem({
  icon,
  label,
  showChevron = true,
}: {
  icon: React.ReactNode;
  label: string;
  showChevron?: boolean;
}) {
  return (
    <View style={menuStyles.item}>
      {icon}
      <Text style={menuStyles.label}>{label}</Text>
      {showChevron && <ChevronRight size={16} color={Colors.textTertiary} />}
    </View>
  );
}

const menuStyles = StyleSheet.create({
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.cardBorder,
    gap: 12,
  },
  label: {
    flex: 1,
    fontSize: 15,
    color: Colors.text,
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    paddingTop: 24,
    paddingBottom: 24,
  },
  avatarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.accentDim,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  name: {
    fontSize: 24,
    fontWeight: '800' as const,
    color: Colors.text,
    marginBottom: 4,
  },
  role: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  summaryCard: {
    backgroundColor: Colors.card,
    borderRadius: 18,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: '800' as const,
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  divider: {
    width: 1,
    height: 36,
    backgroundColor: Colors.cardBorder,
  },
  section: {
    backgroundColor: Colors.card,
    borderRadius: 18,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: Colors.textSecondary,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  moduleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.cardBorder,
    gap: 12,
  },
  moduleIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moduleContent: {
    flex: 1,
  },
  moduleName: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 2,
  },
  moduleDetail: {
    fontSize: 13,
    color: Colors.textTertiary,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    gap: 12,
  },
  menuLabel: {
    flex: 1,
    fontSize: 15,
  },
  footer: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  footerText: {
    fontSize: 13,
    color: Colors.textTertiary,
  },
});
