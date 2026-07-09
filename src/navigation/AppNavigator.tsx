import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useNavigation, type NavigatorScreenParams } from '@react-navigation/native';
import {
  createNativeStackNavigator,
  type NativeStackNavigationProp,
  type NativeStackScreenProps,
} from '@react-navigation/native-stack';

import { DumbbellIcon, HomeIcon, UserIcon, type TabIconProps } from '@/components/icons/TabIcons';
import { HomeScreen } from '@/features/dashboard/screens/HomeScreen';
import { AddExerciseScreen } from '@/features/exercises/screens/AddExerciseScreen';
import { ExerciseDetailScreen } from '@/features/exercises/screens/ExerciseDetailScreen';
import type { Exercise } from '@/features/exercises/types/exercise.types';
import { ProfileScreen } from '@/features/profile/screens/ProfileScreen';
import { CreateRoutineScreen } from '@/features/workout/screens/CreateRoutineScreen';
import { WorkoutScreen } from '@/features/workout/screens/WorkoutScreen';
import { colors, typography } from '@/theme';

/**
 * Authenticated shell: bottom tabs, with full-screen flows (Create Routine,
 * and later the live workout session) presented modally above them so the
 * tab bar never sits under a Cancel/Save flow.
 */
export type AppTabsParamList = {
  Home: undefined;
  Workout: undefined;
  Profile: undefined;
};

export type AppStackParamList = {
  Tabs: NavigatorScreenParams<AppTabsParamList> | undefined;
  /**
   * `addedExercises` returns picks from the Add flow; `replacement` returns a
   * single swap from the Replace flow.
   */
  CreateRoutine:
    | { addedExercises?: Exercise[]; replacement?: { targetId: string; exercise: Exercise } }
    | undefined;
  /** `replaceTargetId` runs the picker in single-select replace mode. */
  AddExercise: { replaceTargetId?: string } | undefined;
  ExerciseDetail: { exerciseId: string };
};

const Tabs = createBottomTabNavigator<AppTabsParamList>();
const Stack = createNativeStackNavigator<AppStackParamList>();

const renderIcon =
  (Icon: React.ComponentType<TabIconProps>) =>
  ({ color }: { color: string }) =>
    <Icon color={color} />;

/** Bridges the navigation-agnostic WorkoutScreen into the parent stack. */
function WorkoutRoute() {
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  return <WorkoutScreen onNewRoutine={() => navigation.navigate('CreateRoutine')} />;
}

function AppTabs() {
  return (
    <Tabs.Navigator
      initialRouteName="Home"
      screenOptions={{
        headerShown: false,
        animation: 'fade',
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          backgroundColor: colors.backgroundSecondary,
          borderTopColor: colors.divider,
        },
        tabBarLabelStyle: typography.caption,
        sceneStyle: { backgroundColor: colors.background },
      }}
    >
      <Tabs.Screen
        name="Home"
        component={HomeScreen}
        options={{ tabBarIcon: renderIcon(HomeIcon), tabBarAccessibilityLabel: 'Home tab' }}
      />
      <Tabs.Screen
        name="Workout"
        component={WorkoutRoute}
        options={{ tabBarIcon: renderIcon(DumbbellIcon), tabBarAccessibilityLabel: 'Workout tab' }}
      />
      <Tabs.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ tabBarIcon: renderIcon(UserIcon), tabBarAccessibilityLabel: 'Profile tab' }}
      />
    </Tabs.Navigator>
  );
}

type CreateRoutineRouteProps = NativeStackScreenProps<AppStackParamList, 'CreateRoutine'>;
type AddExerciseRouteProps = NativeStackScreenProps<AppStackParamList, 'AddExercise'>;
type ExerciseDetailRouteProps = NativeStackScreenProps<AppStackParamList, 'ExerciseDetail'>;

/** Save currently just dismisses; the create-routine mutation lands here. */
function CreateRoutineRoute({ navigation, route }: CreateRoutineRouteProps) {
  return (
    <CreateRoutineScreen
      addedExercises={route.params?.addedExercises}
      replacement={route.params?.replacement}
      onAddExercise={() => navigation.navigate('AddExercise')}
      onReplaceExercise={targetId => navigation.navigate('AddExercise', { replaceTargetId: targetId })}
      onCancel={() => navigation.goBack()}
      onSave={() => navigation.goBack()}
    />
  );
}

/** Pops back to the routine draft, delivering the selection via params. */
function AddExerciseRoute({ navigation, route }: AddExerciseRouteProps) {
  const replaceTargetId = route.params?.replaceTargetId;
  return (
    <AddExerciseScreen
      onCancel={() => navigation.goBack()}
      onDone={exercises => navigation.popTo('CreateRoutine', { addedExercises: exercises })}
      onReplace={
        replaceTargetId
          ? exercise =>
              navigation.popTo('CreateRoutine', {
                replacement: { targetId: replaceTargetId, exercise },
              })
          : undefined
      }
      onOpenExercise={exercise =>
        navigation.navigate('ExerciseDetail', { exerciseId: exercise.id })
      }
    />
  );
}

/** Read-only exercise info drilled into from the picker. */
function ExerciseDetailRoute({ navigation, route }: ExerciseDetailRouteProps) {
  return (
    <ExerciseDetailScreen
      exerciseId={route.params.exerciseId}
      onClose={() => navigation.goBack()}
    />
  );
}

export function AppNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="Tabs" component={AppTabs} />
      <Stack.Screen
        name="CreateRoutine"
        component={CreateRoutineRoute}
        options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
      />
      <Stack.Screen
        name="AddExercise"
        component={AddExerciseRoute}
        options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
      />
      <Stack.Screen
        name="ExerciseDetail"
        component={ExerciseDetailRoute}
        options={{ animation: 'slide_from_right' }}
      />
    </Stack.Navigator>
  );
}
