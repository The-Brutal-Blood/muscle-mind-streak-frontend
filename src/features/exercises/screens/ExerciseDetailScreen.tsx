import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { ChevronLeftIcon } from '@/components/icons/ActionIcons';
import { Button, Loader, Screen, Text } from '@/components/ui';
import { colors, radius, spacing } from '@/theme';

import { ExerciseGif } from '../components/ExerciseGif';
import { ExerciseHistoryTab } from '../components/ExerciseHistoryTab';
import { ExerciseProgressSection } from '../components/ExerciseProgressSection';
import { useExerciseDetail } from '../hooks/useExerciseDetail';
import type { Exercise } from '../types/exercise.types';

export interface ExerciseDetailScreenProps {
  exerciseId: string;
  /** Dismisses the screen. Navigation is owned by the caller. */
  onClose?: () => void;
}

type TabKey = 'summary' | 'history' | 'instructions';

const TABS: ReadonlyArray<{ key: TabKey; label: string }> = [
  { key: 'summary', label: 'Summary' },
  { key: 'history', label: 'History' },
  { key: 'instructions', label: 'Instructions' },
];

const BACK_BUTTON_SIZE = 40;

export const ExerciseDetailScreen = React.memo(function ExerciseDetailScreenBase({
  exerciseId,
  onClose,
}: ExerciseDetailScreenProps) {
  const [tab, setTab] = useState<TabKey>('summary');
  const { data: exercise, isPending, isError, error, refetch } = useExerciseDetail(exerciseId);

  return (
    <Screen padded={false}>
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Go back"
          accessibilityHint="Returns to the exercise list"
          onPress={onClose}
          hitSlop={spacing.sm}
          style={({ pressed }) => [styles.backButton, pressed && styles.backButtonPressed]}
        >
          <ChevronLeftIcon color={colors.textPrimary} size={24} />
        </Pressable>
        <Text
          variant="title"
          accessibilityRole="header"
          numberOfLines={1}
          style={styles.headerTitle}
        >
          {exercise?.name ?? 'Exercise'}
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.tabBar}>
        {TABS.map(({ key, label }) => {
          const active = key === tab;
          return (
            <Pressable
              key={key}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              accessibilityLabel={`${label} tab`}
              onPress={() => setTab(key)}
              style={styles.tab}
            >
              <Text variant="subtitle" color={active ? 'primary' : 'textSecondary'}>
                {label}
              </Text>
              <View style={[styles.tabIndicator, active && styles.tabIndicatorActive]} />
            </Pressable>
          );
        })}
      </View>

      {isPending ? (
        <Loader fullscreen />
      ) : isError ? (
        <View style={styles.stateContainer}>
          <View style={styles.errorBox} accessibilityRole="alert" accessibilityLiveRegion="polite">
            <Text variant="bodySmall" color="error">
              {error.message}
            </Text>
          </View>
          <Button
            label="Try Again"
            variant="outline"
            size="md"
            onPress={() => refetch()}
            accessibilityLabel="Try Again"
            accessibilityHint="Reloads the exercise details"
          />
        </View>
      ) : tab === 'summary' ? (
        <SummaryTab exercise={exercise} />
      ) : tab === 'history' ? (
        <ExerciseHistoryTab exerciseId={exerciseId} />
      ) : (
        <InstructionsTab exercise={exercise} />
      )}
    </Screen>
  );
});

function SummaryTab({ exercise }: { exercise: Exercise }) {
  return (
    <ScrollView
      style={styles.flex}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <ExerciseGif gifUrl={exercise.gifUrl} imageUrl={exercise.imageUrl} />

      <View style={styles.detailsCard}>
        <DetailRow label="Primary muscle" value={exercise.primaryMuscle} />
        <DetailRow label="Category" value={exercise.category} />
        <DetailRow label="Equipment" value={exercise.equipment} last />
      </View>

      <ExerciseProgressSection exerciseId={exercise.id} />
    </ScrollView>
  );
}

function DetailRow({ label, value, last }: { label: string; value: string; last?: boolean }) {
  return (
    <View style={[styles.detailRow, last && styles.detailRowLast]}>
      <Text variant="bodySmall" color="textSecondary" style={styles.detailLabel}>
        {label}
      </Text>
      <Text variant="subtitle" numberOfLines={2} style={styles.detailValue}>
        {value}
      </Text>
    </View>
  );
}

function InstructionsTab({ exercise }: { exercise: Exercise }) {
  const hasOverview = exercise.instructions.trim().length > 0;
  const steps = exercise.instructionSteps;

  return (
    <ScrollView
      style={styles.flex}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {hasOverview ? (
        <>
          <Text variant="label" color="textSecondary" style={styles.sectionLabel}>
            OVERVIEW
          </Text>
          <Text variant="body" color="textPrimary" style={styles.overview}>
            {exercise.instructions}
          </Text>
        </>
      ) : null}

      {steps.length > 0 ? (
        <>
          <Text variant="label" color="textSecondary" style={styles.sectionLabel}>
            STEPS
          </Text>
          <View style={styles.steps}>
            {steps.map((step, index) => (
              <View key={`${index}-${step.slice(0, 12)}`} style={styles.step}>
                <View style={styles.stepBadge}>
                  <Text variant="bodySmall" color="textOnPrimary" style={styles.stepNumber}>
                    {index + 1}
                  </Text>
                </View>
                <Text variant="body" color="textPrimary" style={styles.stepText}>
                  {step}
                </Text>
              </View>
            ))}
          </View>
        </>
      ) : null}

      {!hasOverview && steps.length === 0 ? (
        <Text variant="body" color="textSecondary" align="center" style={styles.noInstructions}>
          No instructions available for this exercise.
        </Text>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.backgroundSecondary,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.divider,
  },
  backButton: {
    width: BACK_BUTTON_SIZE,
    height: BACK_BUTTON_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BACK_BUTTON_SIZE / 2,
  },
  backButtonPressed: {
    backgroundColor: colors.surface,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    textTransform: 'capitalize',
  },
  headerSpacer: {
    width: BACK_BUTTON_SIZE,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: colors.backgroundSecondary,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.divider,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingTop: spacing.md,
    gap: spacing.sm,
  },
  tabIndicator: {
    height: 2,
    alignSelf: 'stretch',
    backgroundColor: 'transparent',
  },
  tabIndicatorActive: {
    backgroundColor: colors.primary,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing['3xl'],
  },
  detailsCard: {
    marginTop: spacing.xl,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    paddingHorizontal: spacing.lg,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.divider,
  },
  detailRowLast: {
    borderBottomWidth: 0,
  },
  detailLabel: {
    flexShrink: 0,
  },
  detailValue: {
    flex: 1,
    textAlign: 'right',
    textTransform: 'capitalize',
  },
  sectionLabel: {
    marginBottom: spacing.sm,
  },
  overview: {
    marginBottom: spacing.xl,
  },
  steps: {
    gap: spacing.md,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  stepBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.xxs,
  },
  stepNumber: {
    fontWeight: '700',
  },
  stepText: {
    flex: 1,
  },
  noInstructions: {
    marginTop: spacing['3xl'],
  },
  stateContainer: {
    padding: spacing['3xl'],
    gap: spacing.md,
    alignItems: 'center',
  },
  errorBox: {
    alignSelf: 'stretch',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.error,
    borderRadius: radius.md,
    padding: spacing.md,
  },
});
