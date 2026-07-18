import React, { useCallback, useRef, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { useFocusEffect, useNavigation } from '@react-navigation/native';

import { Button, Screen, Text } from '@/components/ui';
import type { AppTabsParamList } from '@/navigation/AppNavigator';
import { colors, radius, spacing } from '@/theme';

import { HistoryEmptyState } from '../components/HistoryEmptyState';
import { HistorySkeleton } from '../components/HistorySkeleton';
import { WorkoutHistoryCard } from '../components/WorkoutHistoryCard';
import { useWorkoutHistory } from '../hooks/useWorkoutHistory';
import type { WorkoutHistoryItem } from '../types/history.types';
import { formatWorkoutCount } from '../utils/historyFormat';

function ItemSeparator() {
  return <View style={styles.separator} />;
}

export const HistoryScreen = React.memo(function HistoryScreenBase() {
  const { data, isPending, isError, error, refetch, isRefetching } = useWorkoutHistory();
  const navigation = useNavigation<BottomTabNavigationProp<AppTabsParamList>>();

  const handleStartWorkout = useCallback(() => navigation.navigate('Workout'), [navigation]);

  // Bumped on every tab focus: refreshes the list from the API and remounts
  // the cards (new keys) so they always open collapsed.
  const [focusKey, setFocusKey] = useState(0);
  const refetchRef = useRef(refetch);
  refetchRef.current = refetch;
  useFocusEffect(
    useCallback(() => {
      refetchRef.current();
      setFocusKey(key => key + 1);
    }, []),
  );

  const renderItem = useCallback(
    ({ item }: { item: WorkoutHistoryItem }) => <WorkoutHistoryCard workout={item} />,
    [],
  );
  const keyExtractor = useCallback(
    (item: WorkoutHistoryItem) => `${focusKey}:${item.workoutSessionId}`,
    [focusKey],
  );

  const content = data?.content ?? [];

  return (
    <Screen padded={false} edges={['top']}>
      <View style={styles.header}>
        <Text variant="headingXL" accessibilityRole="header">
          History
        </Text>
        {data ? (
          <Text variant="subtitle" color="textSecondary" style={styles.count}>
            {formatWorkoutCount(data.totalElements)}
          </Text>
        ) : null}
      </View>

      {isPending ? (
        <HistorySkeleton />
      ) : isError ? (
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
            accessibilityHint="Reloads your workout history"
            style={styles.retryButton}
          />
        </View>
      ) : (
        <FlatList
          style={styles.list}
          data={content}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          ItemSeparatorComponent={ItemSeparator}
          contentContainerStyle={content.length === 0 ? styles.emptyContent : styles.listContent}
          showsVerticalScrollIndicator={false}
          initialNumToRender={5}
          windowSize={7}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor={colors.primary}
              colors={[colors.primary]}
              progressBackgroundColor={colors.card}
            />
          }
          ListEmptyComponent={<HistoryEmptyState onStartWorkout={handleStartWorkout} />}
        />
      )}
    </Screen>
  );
});

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
  },
  count: {
    marginTop: spacing.xxs,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xs,
    paddingBottom: spacing['7xl'],
  },
  emptyContent: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: spacing['7xl'],
  },
  separator: {
    height: spacing.lg,
  },
  errorState: {
    flex: 1,
    justifyContent: 'center',
    gap: spacing.lg,
    paddingHorizontal: spacing.lg,
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
