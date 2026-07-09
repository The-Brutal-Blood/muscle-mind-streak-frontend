import React, { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { ChevronDownIcon, SearchIcon } from '@/components/icons/ActionIcons';
import { Button, Loader, Screen, Text } from '@/components/ui';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { colors, radius, spacing, typography } from '@/theme';

import { ExerciseListItem } from '../components/ExerciseListItem';
import { FilterSheet } from '../components/FilterSheet';
import {
  useCategoryOptions,
  useEquipmentOptions,
} from '../hooks/useExerciseFilterOptions';
import { useExercises } from '../hooks/useExercises';
import type { Exercise } from '../types/exercise.types';

export interface AddExerciseScreenProps {
  /** Dismisses without selecting. Navigation is owned by the caller. */
  onCancel?: () => void;
  /** Returns the chosen exercises to the routine being edited. */
  onDone?: (exercises: Exercise[]) => void;
  /** Opens an exercise's detail screen. Navigation is owned by the caller. */
  onOpenExercise?: (exercise: Exercise) => void;
  /**
   * When set, the picker runs in single-select "replace" mode: tapping a row
   * immediately returns that exercise instead of building a multi-selection.
   */
  onReplace?: (exercise: Exercise) => void;
}

interface FilterButtonProps {
  label: string;
  active: boolean;
  onPress: () => void;
  accessibilityLabel: string;
}

const FilterButton = React.memo(function FilterButtonBase({
  label,
  active,
  onPress,
  accessibilityLabel,
}: FilterButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ selected: active }}
      accessibilityHint="Opens filter options"
      onPress={onPress}
      style={({ pressed }) => [
        styles.filterButton,
        active && styles.filterButtonActive,
        pressed && styles.filterButtonPressed,
      ]}
    >
      <Text
        variant="label"
        color={active ? 'primary' : 'textPrimary'}
        numberOfLines={1}
        style={styles.filterLabel}
      >
        {label}
      </Text>
      <ChevronDownIcon color={active ? colors.primary : colors.textSecondary} size={16} />
    </Pressable>
  );
});

export const AddExerciseScreen = React.memo(function AddExerciseScreenBase({
  onCancel,
  onDone,
  onOpenExercise,
  onReplace,
}: AddExerciseScreenProps) {
  const replaceMode = onReplace != null;
  const [searchTerm, setSearchTerm] = useState('');
  const [equipment, setEquipment] = useState<string | null>(null);
  const [category, setCategory] = useState<string | null>(null);
  const [openSheet, setOpenSheet] = useState<'equipment' | 'category' | null>(null);
  const [selected, setSelected] = useState<Map<string, Exercise>>(new Map());

  const debouncedSearch = useDebouncedValue(searchTerm.trim());

  const filters = useMemo(
    () => ({
      search: debouncedSearch || undefined,
      equipment: equipment ?? undefined,
      category: category ?? undefined,
    }),
    [debouncedSearch, equipment, category],
  );

  const {
    data,
    isPending,
    isError,
    error,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useExercises(filters);

  const equipmentOptions = useEquipmentOptions();
  const categoryOptions = useCategoryOptions();

  const exercises = useMemo(() => data?.pages.flatMap(page => page.content) ?? [], [data]);

  const toggleExercise = (exercise: Exercise) => {
    setSelected(current => {
      const next = new Map(current);
      if (next.has(exercise.id)) {
        next.delete(exercise.id);
      } else {
        next.set(exercise.id, exercise);
      }
      return next;
    });
  };

  const handleDone = () => {
    if (selected.size === 0) {
      return;
    }
    onDone?.(Array.from(selected.values()));
  };

  const handleEndReached = () => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  };

  return (
    <Screen padded={false}>
      <View style={styles.header}>
        <Button
          label="Cancel"
          variant="ghost"
          size="sm"
          onPress={onCancel}
          accessibilityLabel="Cancel"
          accessibilityHint="Closes without adding exercises"
        />
        <Text variant="title" accessibilityRole="header">
          {replaceMode ? 'Replace Exercise' : 'Add Exercise'}
        </Text>
        {replaceMode ? (
          <View style={styles.headerSpacer} />
        ) : (
          <Button
            label={selected.size > 0 ? `Add (${selected.size})` : 'Add'}
            variant="primary"
            size="sm"
            disabled={selected.size === 0}
            onPress={handleDone}
            accessibilityLabel={
              selected.size > 0 ? `Add ${selected.size} exercises` : 'Add exercises'
            }
            accessibilityHint="Adds the selected exercises to your routine"
          />
        )}
      </View>

      <View style={styles.controls}>
        <View style={styles.searchField}>
          <SearchIcon color={colors.placeholder} />
          <TextInput
            value={searchTerm}
            onChangeText={setSearchTerm}
            placeholder="Search exercise"
            placeholderTextColor={colors.placeholder}
            selectionColor={colors.primary}
            style={styles.searchInput}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
            accessibilityLabel="Search exercise"
            accessibilityHint="Filters the exercise list by name"
          />
        </View>
        <View style={styles.filterRow}>
          <FilterButton
            label={equipment ?? 'All Equipment'}
            active={equipment != null}
            onPress={() => setOpenSheet('equipment')}
            accessibilityLabel={`Equipment filter: ${equipment ?? 'All Equipment'}`}
          />
          <FilterButton
            label={category ?? 'All Muscles'}
            active={category != null}
            onPress={() => setOpenSheet('category')}
            accessibilityLabel={`Muscle filter: ${category ?? 'All Muscles'}`}
          />
        </View>
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
            accessibilityHint="Reloads the exercise list"
          />
        </View>
      ) : (
        <FlatList
          data={exercises}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <ExerciseListItem
              exercise={item}
              selected={onReplace ? false : selected.has(item.id)}
              onToggle={onReplace ?? toggleExercise}
              onInfo={onOpenExercise}
            />
          )}
          contentContainerStyle={styles.listContent}
          keyboardShouldPersistTaps="handled"
          onEndReached={handleEndReached}
          onEndReachedThreshold={0.4}
          ListEmptyComponent={
            <View style={styles.stateContainer}>
              <Text variant="subtitle" color="textSecondary" align="center">
                No exercises found
              </Text>
              <Text variant="bodySmall" color="textDisabled" align="center">
                Try a different search or filter.
              </Text>
            </View>
          }
          ListFooterComponent={
            isFetchingNextPage ? <Loader size="small" style={styles.footerLoader} /> : null
          }
        />
      )}

      <FilterSheet
        visible={openSheet === 'equipment'}
        title="Equipment"
        allLabel="All Equipment"
        options={equipmentOptions.data ?? []}
        selected={equipment}
        loading={equipmentOptions.isPending}
        onSelect={setEquipment}
        onClose={() => setOpenSheet(null)}
      />
      <FilterSheet
        visible={openSheet === 'category'}
        title="Muscle Group"
        allLabel="All Muscles"
        options={categoryOptions.data ?? []}
        selected={category}
        loading={categoryOptions.isPending}
        onSelect={setCategory}
        onClose={() => setOpenSheet(null)}
      />
    </Screen>
  );
});

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: colors.backgroundSecondary,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.divider,
  },
  headerSpacer: {
    width: 64,
  },
  controls: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    gap: spacing.md,
  },
  searchField: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    minHeight: 48,
  },
  searchInput: {
    ...typography.body,
    flex: 1,
    color: colors.textPrimary,
    paddingVertical: spacing.md,
  },
  filterRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  filterButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    minHeight: 44,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  filterButtonActive: {
    borderColor: colors.primary,
    backgroundColor: colors.surface,
  },
  filterButtonPressed: {
    backgroundColor: colors.surface,
  },
  filterLabel: {
    textTransform: 'capitalize',
    flexShrink: 1,
  },
  listContent: {
    paddingHorizontal: spacing.sm,
    paddingTop: spacing.sm,
    paddingBottom: spacing['3xl'],
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
  footerLoader: {
    paddingVertical: spacing.lg,
  },
});
