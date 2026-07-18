import React from 'react';
import {
  createNativeStackNavigator,
  type NativeStackScreenProps,
} from '@react-navigation/native-stack';

import { LoginScreen } from '@/features/auth/screens/LoginScreen';
import { SignUpScreen } from '@/features/auth/screens/SignUpScreen';
import { VerifyOtpScreen } from '@/features/auth/screens/VerifyOtpScreen';
import { WelcomeScreen } from '@/features/auth/screens/WelcomeScreen';
import { CompleteProfileScreen } from '@/features/onboarding/screens/CompleteProfileScreen';
import { useAuth } from '@/providers/AuthProvider';
import { colors } from '@/theme';

/**
 * Unauthenticated flow: Welcome → (Signup → OTP → Complete Profile) | Login.
 * Screens stay navigation-agnostic; thin route wrappers bridge their
 * callbacks into the stack. Completing a profile flips the auth state and
 * the RootNavigator swaps this whole stack for the app tabs.
 */
export type AuthStackParamList = {
  Welcome: undefined;
  Login: undefined;
  Signup: undefined;
  VerifyOtp: { email: string };
  CompleteProfile: undefined;
};

const Stack = createNativeStackNavigator<AuthStackParamList>();

type WelcomeRouteProps = NativeStackScreenProps<AuthStackParamList, 'Welcome'>;
type LoginRouteProps = NativeStackScreenProps<AuthStackParamList, 'Login'>;
type SignupRouteProps = NativeStackScreenProps<AuthStackParamList, 'Signup'>;
type VerifyOtpRouteProps = NativeStackScreenProps<AuthStackParamList, 'VerifyOtp'>;

function WelcomeRoute({ navigation }: WelcomeRouteProps) {
  return (
    <WelcomeScreen
      onCreateAccount={() => navigation.navigate('Signup')}
      onSignIn={() => navigation.navigate('Login')}
    />
  );
}

/**
 * A completed profile needs no navigation here — the AuthProvider flips to
 * 'authenticated' and the RootNavigator swaps stacks. Only the incomplete-
 * profile case routes onward, into onboarding.
 */
function LoginRoute({ navigation }: LoginRouteProps) {
  return (
    <LoginScreen
      onNeedsProfileSetup={() => navigation.replace('CompleteProfile')}
      onBack={() => navigation.goBack()}
    />
  );
}

/**
 * On successful registration the backend has emailed an OTP; carry the
 * normalized email forward as a route param for verification.
 */
function SignupRoute({ navigation }: SignupRouteProps) {
  return (
    <SignUpScreen
      onRegistered={email => navigation.navigate('VerifyOtp', { email })}
      onBack={() => navigation.goBack()}
    />
  );
}

/**
 * `replace` removes the OTP screen from history — a verified user should
 * never navigate back into the code-entry flow.
 */
function VerifyOtpRoute({ navigation, route }: VerifyOtpRouteProps) {
  return (
    <VerifyOtpScreen
      email={route.params.email}
      onContinue={() => navigation.replace('CompleteProfile')}
    />
  );
}

/** Confirmed complete profile ends the auth flow via the session switch. */
function CompleteProfileRoute() {
  const { completeSession } = useAuth();
  return <CompleteProfileScreen onCompleted={profile => completeSession(profile)} />;
}

export function AuthNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="Welcome"
      screenOptions={{
        headerShown: false,
        animation: 'fade',
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="Welcome" component={WelcomeRoute} />
      <Stack.Screen name="Login" component={LoginRoute} />
      <Stack.Screen name="Signup" component={SignupRoute} />
      <Stack.Screen name="VerifyOtp" component={VerifyOtpRoute} />
      <Stack.Screen name="CompleteProfile" component={CompleteProfileRoute} />
    </Stack.Navigator>
  );
}
