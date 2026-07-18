import React from 'react';
import { View } from 'react-native';
import {
  BottomTabBar,
  createBottomTabNavigator,
  type BottomTabBarProps,
} from '@react-navigation/bottom-tabs';
import { useNavigation, type NavigatorScreenParams } from '@react-navigation/native';
import {
  createNativeStackNavigator,
  type NativeStackNavigationProp,
  type NativeStackScreenProps,
} from '@react-navigation/native-stack';

import { DumbbellIcon, HistoryIcon, HomeIcon, type TabIconProps } from '@/components/icons/TabIcons';
import { AddExerciseScreen } from '@/features/exercises/screens/AddExerciseScreen';
import { ExerciseDetailScreen } from '@/features/exercises/screens/ExerciseDetailScreen';
import type { Exercise } from '@/features/exercises/types/exercise.types';
import { HistoryScreen } from '@/features/history/screens/HistoryScreen';
import { HomeWithDrawer } from '@/features/menu/screens/HomeWithDrawer';
import { ProfileScreen } from '@/features/profile/screens/ProfileScreen';
import { WeightTrackerScreen } from '@/features/weight/screens/WeightTrackerScreen';
import { MinimizedWorkoutBar } from '@/features/workout/components/MinimizedWorkoutBar';
import { PersonalRecordCelebrationProvider } from '@/features/workout/context/PersonalRecordCelebrationContext';
import {
  useWorkoutSessionContext,
  WorkoutSessionProvider,
} from '@/features/workout/context/WorkoutSessionContext';
import { CreateRoutineScreen } from '@/features/workout/screens/CreateRoutineScreen';
import { WorkoutScreen } from '@/features/workout/screens/WorkoutScreen';
import { WorkoutSessionScreen } from '@/features/workout/screens/WorkoutSessionScreen';
import type { WorkoutSessionState } from '@/features/workout/types/workout.types';
import { colors, typography } from '@/theme';

/**
 * Authenticated shell: bottom tabs, with full-screen flows (Create Routine,
 * and later the live workout session) presented modally above them so the
 * tab bar never sits under a Cancel/Save flow.
 */
export type AppTabsParamList = {
  Home: undefined;
  Workout: undefined;
  History: undefined;
};

export type AppStackParamList = {
  Tabs: NavigatorScreenParams<AppTabsParamList> | undefined;
  /**
   * `addedExercises` returns picks from the Add flow; `replacement` returns a
   * single swap from the Replace flow.
   */
  CreateRoutine:
    | {
        addedExercises?: Exercise[];
        replacement?: { targetId: string; exercise: Exercise };
        /** 'edit'/'duplicate' seed the editor from `sourceRoutineId`. */
        mode?: 'create' | 'edit' | 'duplicate';
        sourceRoutineId?: string;
      }
    | undefined;
  /** `replaceTargetId` runs the picker in single-select replace mode; `returnTo`
   * routes the selection back to the caller (routine editor or live session). */
  AddExercise: { replaceTargetId?: string; returnTo?: 'CreateRoutine' | 'WorkoutSession' } | undefined;
  ExerciseDetail: { exerciseId: string };
  /** `initialState` starts a fresh session; absent means resume from storage. */
  WorkoutSession: { initialState?: WorkoutSessionState; addedExercises?: Exercise[] } | undefined;
  /** Placeholder fitness tool opened from the Home drawer. */
  WeightTracker: undefined;
  /** User profile, opened from the Home drawer (moved off the bottom tabs). */
  Profile: undefined;
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
  const { startSession } = useWorkoutSessionContext();
  return (
    <WorkoutScreen
      onNewRoutine={() => navigation.navigate('CreateRoutine')}
      onEditRoutine={routineId =>
        navigation.navigate('CreateRoutine', { mode: 'edit', sourceRoutineId: routineId })
      }
      onDuplicateRoutine={routineId =>
        navigation.navigate('CreateRoutine', { mode: 'duplicate', sourceRoutineId: routineId })
      }
      onStartSession={initialState => {
        startSession(initialState);
        navigation.navigate('WorkoutSession', { initialState });
      }}
    />
  );
}

/** Tab bar with the in-progress workout bar floating above it. */
function AppTabBar(props: BottomTabBarProps) {
  return (
    <View>
      <MinimizedWorkoutBar />
      <BottomTabBar {...props} />
    </View>
  );
}

function AppTabs() {
  return (
    <Tabs.Navigator
      initialRouteName="Home"
      tabBar={AppTabBar}
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
        component={HomeWithDrawer}
        options={{ tabBarIcon: renderIcon(HomeIcon), tabBarAccessibilityLabel: 'Home tab' }}
      />
      <Tabs.Screen
        name="Workout"
        component={WorkoutRoute}
        options={{ tabBarIcon: renderIcon(DumbbellIcon), tabBarAccessibilityLabel: 'Workout tab' }}
      />
      <Tabs.Screen
        name="History"
        component={HistoryScreen}
        options={{ tabBarIcon: renderIcon(HistoryIcon), tabBarAccessibilityLabel: 'History tab' }}
      />
    </Tabs.Navigator>
  );
}

type CreateRoutineRouteProps = NativeStackScreenProps<AppStackParamList, 'CreateRoutine'>;
type AddExerciseRouteProps = NativeStackScreenProps<AppStackParamList, 'AddExercise'>;
type ExerciseDetailRouteProps = NativeStackScreenProps<AppStackParamList, 'ExerciseDetail'>;
type WorkoutSessionRouteProps = NativeStackScreenProps<AppStackParamList, 'WorkoutSession'>;
type WeightTrackerRouteProps = NativeStackScreenProps<AppStackParamList, 'WeightTracker'>;
type ProfileRouteProps = NativeStackScreenProps<AppStackParamList, 'Profile'>;

/** Save currently just dismisses; the create-routine mutation lands here. */
function CreateRoutineRoute({ navigation, route }: CreateRoutineRouteProps) {
  return (
    <CreateRoutineScreen
      mode={route.params?.mode}
      sourceRoutineId={route.params?.sourceRoutineId}
      addedExercises={route.params?.addedExercises}
      replacement={route.params?.replacement}
      onAddExercise={() => navigation.navigate('AddExercise')}
      onReplaceExercise={targetId => navigation.navigate('AddExercise', { replaceTargetId: targetId })}
      onOpenExerciseDetail={exerciseId => navigation.navigate('ExerciseDetail', { exerciseId })}
      onCancel={() => navigation.goBack()}
      onSaved={() => navigation.goBack()}
    />
  );
}

/** Pops back to the caller (routine draft or live session), delivering the selection. */
function AddExerciseRoute({ navigation, route }: AddExerciseRouteProps) {
  const replaceTargetId = route.params?.replaceTargetId;
  const returnTo = route.params?.returnTo ?? 'CreateRoutine';
  return (
    <AddExerciseScreen
      onCancel={() => navigation.goBack()}
      onDone={exercises =>
        returnTo === 'WorkoutSession'
          ? // merge so the live session keeps its `initialState` param — without
            // it, popTo replaces params, drops initialState, and the session
            // screen reloads from storage and discards the just-added exercise.
            navigation.popTo('WorkoutSession', { addedExercises: exercises }, { merge: true })
          : navigation.popTo('CreateRoutine', { addedExercises: exercises })
      }
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

/** Live workout session; finishing/discarding returns to the Workout tab. */
function WorkoutSessionRoute({ navigation, route }: WorkoutSessionRouteProps) {
  const { endSession } = useWorkoutSessionContext();
  return (
    <WorkoutSessionScreen
      initialState={route.params?.initialState}
      addedExercises={route.params?.addedExercises}
      onBack={() => navigation.goBack()}
      onFinished={() => {
        endSession();
        navigation.popToTop();
      }}
      onDiscarded={() => {
        endSession();
        navigation.popToTop();
      }}
      onAddExercise={() => navigation.navigate('AddExercise', { returnTo: 'WorkoutSession' })}
      onOpenExerciseDetail={exerciseId => navigation.navigate('ExerciseDetail', { exerciseId })}
    />
  );
}

/** Placeholder fitness tool opened from the Home drawer. */
function WeightTrackerRoute({ navigation }: WeightTrackerRouteProps) {
  return <WeightTrackerScreen onBack={() => navigation.goBack()} />;
}

/** User profile opened from the Home drawer (moved off the bottom tabs). */
function ProfileRoute({ navigation }: ProfileRouteProps) {
  return <ProfileScreen onBack={() => navigation.goBack()} />;
}

export function AppNavigator() {
  return (
    <WorkoutSessionProvider>
      <PersonalRecordCelebrationProvider>
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
        // gestureEnabled:false so only Cancel (which confirms) can dismiss —
        // a swipe-down must not silently discard the routine draft.
        options={{
          presentation: 'modal',
          animation: 'slide_from_bottom',
          gestureEnabled: false,
        }}
      />
      <Stack.Screen
        name="AddExercise"
        component={AddExerciseRoute}
        // gestureEnabled:false so a swipe-down can't silently discard the
        // in-progress exercise selection — Cancel is the only way out.
        options={{
          presentation: 'modal',
          animation: 'slide_from_bottom',
          gestureEnabled: false,
        }}
      />
      <Stack.Screen
        name="ExerciseDetail"
        component={ExerciseDetailRoute}
        options={{ animation: 'slide_from_right' }}
      />
      <Stack.Screen
        name="WorkoutSession"
        component={WorkoutSessionRoute}
        options={{ presentation: 'modal', animation: 'slide_from_bottom', gestureEnabled: false }}
      />
      <Stack.Screen
        name="WeightTracker"
        component={WeightTrackerRoute}
        options={{ animation: 'slide_from_right' }}
      />
      <Stack.Screen
        name="Profile"
        component={ProfileRoute}
        options={{ animation: 'slide_from_right' }}
      />
      </Stack.Navigator>
      </PersonalRecordCelebrationProvider>
    </WorkoutSessionProvider>
  );
}
