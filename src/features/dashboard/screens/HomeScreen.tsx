import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Easing,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQueryClient } from '@tanstack/react-query';

import { Button, Screen, Text } from '@/components/ui';
import { HomeAppBar } from '@/features/menu/components/HomeAppBar';
import { LogWeightSheet } from '@/features/weight/components/LogWeightSheet';
import { bodyWeightKeys, useLogBodyWeight } from '@/features/weight/hooks/useLogBodyWeight';
import { usePersonalRecordCelebration } from '@/features/workout/context/PersonalRecordCelebrationContext';
import { useWorkoutSessionContext } from '@/features/workout/context/WorkoutSessionContext';
import { useStartWorkoutSession } from '@/features/workout/hooks/useWorkoutSession';
import { toSessionState } from '@/features/workout/utils/workoutSession';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import type { AppStackParamList } from '@/navigation/AppNavigator';
import { colors, radius, spacing } from '@/theme';


import { CreateFirstRoutineCard } from '../components/CreateFirstRoutineCard';
import { GreetingHeader } from '../components/GreetingHeader';
import { HomeSkeleton } from '../components/HomeSkeleton';
import { PersonalRecordBanner } from '../components/PersonalRecordBanner';
import { PersonalRecordCard } from '../components/PersonalRecordCard';
import { RecentPersonalRecordsCard } from '../components/RecentPersonalRecordsCard';
import { RecentWorkoutCard } from '../components/RecentWorkoutCard';
import { RestDayCard } from '../components/RestDayCard';
import { StatsRow } from '../components/StatsRow';
import { StreakCard } from '../components/StreakCard';
import { TodayWorkoutCard } from '../components/TodayWorkoutCard';
import { WeeklyGoalCard } from '../components/WeeklyGoalCard';
import { homeKeys, useHome } from '../hooks/useHome';

const CONTENT_SLIDE_DISTANCE = 24;
/** Delay after the dashboard settles before prompting for today's weight. */
const WEIGHT_PROMPT_DELAY_MS = 1500;

/**
 * Whether the dashboard entrance has already played this session. The Home
 * screen remounts when returning from a full-screen flow opened via the side
 * drawer (e.g. Weight Tracker), so a per-mount guard would replay the slide-up
 * every time; module scope makes it play exactly once and lets later mounts
 * render already-settled.
 */
let hasPlayedEntrance = false;

export const HomeScreen = React.memo(function HomeScreenBase() {
  const { data, isPending, isError, error, refetch } = useHome();

  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const { startSession } = useWorkoutSessionContext();
  const startMutation = useStartWorkoutSession();
  // Which of today's routines is being started, so only that card shows a spinner.
  const [startingRoutineId, setStartingRoutineId] = useState<string | null>(null);

  const queryClient = useQueryClient();
  const { data: currentUser } = useCurrentUser();
  // PRs broken by the just-finished workout, celebrated once in a centered card.
  const { pending: pendingRecords, dismiss: dismissRecords } = usePersonalRecordCelebration();
  const logWeightMutation = useLogBodyWeight();
  const [weightSheetVisible, setWeightSheetVisible] = useState(false);
  const weightPromptedRef = useRef(false);
  // The Home tab stays mounted, so its ScrollView keeps its offset across
  // navigation; reset it to the top whenever the screen regains focus.
  const scrollRef = useRef<ScrollView>(null);

  // Pull-to-refresh spinner state, driven only by a user pull. The focus/
  // background refetch must NOT feed the RefreshControl: activating it
  // programmatically insets the list downward, which is what left Home shifted
  // down (and un-fixable by scrollTo) when returning from another screen.
  const [refreshing, setRefreshing] = useState(false);
  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    refetch().finally(() => setRefreshing(false));
  }, [refetch]);

  // Reuse the existing workout flow: create a session, then open the live
  // session screen (same path as the Workout tab's "Start Routine").
  const handleStartWorkout = useCallback(
    (routineId: string) => {
      if (startMutation.isPending) {
        return;
      }
      setStartingRoutineId(routineId);
      startMutation.mutate(routineId, {
        onSuccess: session => {
          setStartingRoutineId(null);
          const state = toSessionState(session);
          startSession(state);
          navigation.navigate('WorkoutSession', { initialState: state });
        },
        onError: err => {
          setStartingRoutineId(null);
          Alert.alert('Could not start workout', err.message, [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Try Again', onPress: () => handleStartWorkout(routineId) },
          ]);
        },
      });
    },
    [startMutation, startSession, navigation],
  );

  const handleCreateRoutine = useCallback(() => navigation.navigate('CreateRoutine'), [navigation]);

  const handleOpenRecentWorkout = useCallback(() => {
    // TODO: navigate to Workout Details once that screen exists.
  }, []);

  const handleSaveWeight = useCallback(
    (weightKg: number) => {
      if (logWeightMutation.isPending) {
        return;
      }
      logWeightMutation.mutate(
        { weight: weightKg },
        {
          onSuccess: () => {
            setWeightSheetVisible(false);
            // Refresh Home and Weight Tracker data with the new entry.
            queryClient.invalidateQueries({ queryKey: homeKeys.summary });
            queryClient.invalidateQueries({ queryKey: bodyWeightKeys.all });
          },
          onError: err => Alert.alert('Could not save weight', err.message),
        },
      );
    },
    [logWeightMutation, queryClient],
  );

  const handleCloseWeightSheet = useCallback(() => setWeightSheetVisible(false), []);

  // Entrance: content fades in while sliding up (matches the Workout tab). Plays
  // once per session — refs start settled on later mounts, and the trigger keys
  // off a stable `hasData` boolean (not `data`), so a focus refetch changing the
  // `data` reference can never restart or interrupt it.
  const reduceMotion = useReducedMotion();
  const contentOpacity = useRef(new Animated.Value(hasPlayedEntrance ? 1 : 0)).current;
  const contentTranslateY = useRef(
    new Animated.Value(hasPlayedEntrance ? 0 : CONTENT_SLIDE_DISTANCE),
  ).current;
  const hasData = data != null;

  useEffect(() => {
    if (reduceMotion === null || !hasData || hasPlayedEntrance) {
      return undefined;
    }
    hasPlayedEntrance = true;
    if (reduceMotion) {
      contentOpacity.setValue(1);
      contentTranslateY.setValue(0);
      return undefined;
    }
    const easeOut = Easing.out(Easing.cubic);
    const entrance = Animated.parallel([
      Animated.timing(contentOpacity, {
        toValue: 1,
        duration: 450,
        easing: easeOut,
        useNativeDriver: true,
      }),
      Animated.timing(contentTranslateY, {
        toValue: 0,
        duration: 500,
        easing: easeOut,
        useNativeDriver: true,
      }),
    ]);
    entrance.start();
    return () => entrance.stop();
  }, [reduceMotion, hasData, contentOpacity, contentTranslateY]);

  // Refresh whenever the Home tab regains focus, so returning here always shows
  // up-to-date data. The initial mount already fetches, so skip the first focus.
  const firstFocus = useRef(true);
  useFocusEffect(
    useCallback(() => {
      // Always land at the top when returning here (the screen stays mounted).
      scrollRef.current?.scrollTo({ y: 0, animated: false });
      if (firstFocus.current) {
        firstFocus.current = false;
        return;
      }
      refetch();
    }, [refetch]),
  );

  // Prompt for today's weight shortly after the dashboard settles, when the
  // backend asks for it. `shouldPromptWeight` flips false→true at most once, so
  // a background refetch won't cancel the pending timer, and the ref guards
  // against re-prompting within the same session.
  const shouldPromptWeight = data?.shouldLogWeight === true;
  useEffect(() => {
    if (!shouldPromptWeight || weightPromptedRef.current) {
      return undefined;
    }
    weightPromptedRef.current = true;
    const timer = setTimeout(() => setWeightSheetVisible(true), WEIGHT_PROMPT_DELAY_MS);
    return () => clearTimeout(timer);
  }, [shouldPromptWeight]);

  if (isPending) {
    return (
      <Screen scrollable edges={['top']} contentContainerStyle={styles.scrollContent}>
        <HomeAppBar />
        <HomeSkeleton />
      </Screen>
    );
  }

  if (isError) {
    return (
      <Screen edges={['top']}>
        <HomeAppBar />
        <View style={styles.errorState}>
          <View style={styles.errorBox} accessibilityRole="alert" accessibilityLiveRegion="polite">
            <Text variant="bodySmall" color="error" align="center">
              {error.message}
            </Text>
          </View>
          <Button
            label="Try Again"
            variant="outline"
            size="md"
            onPress={() => refetch()}
            accessibilityLabel="Try Again"
            accessibilityHint="Reloads your home screen"
            style={styles.retryButton}
          />
        </View>
      </Screen>
    );
  }

  return (
    <View style={styles.flex}>
    <Screen
      scrollable
      edges={['top']}
      scrollViewRef={scrollRef}
      contentContainerStyle={styles.scrollContent}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          tintColor={colors.primary}
          colors={[colors.primary]}
          progressBackgroundColor={colors.card}
        />
      }
    >
      <HomeAppBar />
      <Animated.View
        style={{ opacity: contentOpacity, transform: [{ translateY: contentTranslateY }] }}
      >
        <GreetingHeader greeting={data.greeting} userName={data.userName} />

        {data.streak > 0 ? (
          <View style={styles.section}>
            <StreakCard streak={data.streak} />
          </View>
        ) : null}

        <View style={styles.section}>
          {data.isRestDay ? (
            <RestDayCard />
          ) : data.todayWorkouts.length > 0 ? (
            <>
              <Text variant="label" color="textSecondary" style={styles.sectionLabel}>
                {"Today's Workouts"}
              </Text>
              <View style={styles.workoutList}>
                {data.todayWorkouts.map(workout => (
                  <TodayWorkoutCard
                    key={workout.routineId}
                    workout={workout}
                    onStart={handleStartWorkout}
                    starting={startingRoutineId === workout.routineId}
                    completed={workout.completedToday}
                  />
                ))}
              </View>
            </>
          ) : (
            <CreateFirstRoutineCard onCreateRoutine={handleCreateRoutine} />
          )}
        </View>

        {data.weeklyGoal && data.weeklyGoal.target > 0 ? (
          <View style={styles.section}>
            <WeeklyGoalCard goal={data.weeklyGoal} />
          </View>
        ) : null}

        {data.recentWorkout ? (
          <View style={styles.section}>
            <Text variant="label" color="textSecondary" style={styles.sectionLabel}>
              Recent Workout
            </Text>
            <RecentWorkoutCard workout={data.recentWorkout} onPress={handleOpenRecentWorkout} />
          </View>
        ) : null}

        {data.latestPersonalRecord ? (
          <View style={styles.section}>
            <Text variant="label" color="textSecondary" style={styles.sectionLabel}>
              Heaviest of all time
            </Text>
            <PersonalRecordCard record={data.latestPersonalRecord} />
          </View>
        ) : null}

        {data.recentPersonalRecords && data.recentPersonalRecords.length > 0 ? (
          <View style={styles.section}>
            <Text variant="label" color="textSecondary" style={styles.sectionLabel}>
              🏆 Personal Records
            </Text>
            <RecentPersonalRecordsCard records={data.recentPersonalRecords} />
          </View>
        ) : null}

        {data.stats ? (
          <View style={styles.section}>
            <Text variant="label" color="textSecondary" style={styles.sectionLabel}>
              Statistics
            </Text>
            <StatsRow stats={data.stats} />
          </View>
        ) : null}
      </Animated.View>

      <LogWeightSheet
        visible={weightSheetVisible}
        onClose={handleCloseWeightSheet}
        onSave={handleSaveWeight}
        submitting={logWeightMutation.isPending}
        placeholderWeight={currentUser?.weightKg ?? null}
      />
    </Screen>

    {pendingRecords && pendingRecords.length > 0 ? (
      <PersonalRecordBanner records={pendingRecords} onDismiss={dismissRecords} />
    ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  scrollContent: {
    // Clearance for the bottom tab bar (and the in-progress workout bar).
    paddingBottom: spacing['7xl'],
  },
  section: {
    marginTop: spacing['2xl'],
  },
  sectionLabel: {
    marginBottom: spacing.md,
  },
  workoutList: {
    gap: spacing.lg,
  },
  errorState: {
    flex: 1,
    justifyContent: 'center',
    gap: spacing.lg,
  },
  errorBox: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.error,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  retryButton: {
    alignSelf: 'center',
  },
});
