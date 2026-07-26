import React from 'react';
import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui';
import { spacing } from '@/theme';

import type { HomeGreeting } from '../types/home.types';

export interface GreetingHeaderProps {
  greeting: HomeGreeting;
  userName: string;
}

/** Premium personalized greeting: a large title with the user's name, and a
 *  supporting motivational line. */
export const GreetingHeader = React.memo(function GreetingHeaderBase({
  greeting,
  userName,
}: GreetingHeaderProps) {
  // Only the first name keeps the greeting short and personal.
  const firstName = userName.trim().split(/\s+/)[0];
  const title = firstName ? `${greeting.title}, ${firstName}` : greeting.title;
  return (
    <View accessible accessibilityRole="header">
      <Text variant="displayL">{title}</Text>
      <Text variant="title" color="primary" style={styles.message}>
        {greeting.message}
      </Text>
    </View>
  );
});

const styles = StyleSheet.create({
  message: {
    marginTop: spacing.sm,
  },
});
