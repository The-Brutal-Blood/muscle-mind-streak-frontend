import React from 'react';
import { StyleSheet, View } from 'react-native';

import { Card, Divider, Text } from '@/components/ui';
import { spacing } from '@/theme';
import { formatPersonalRecordValue } from '@/utils/personalRecord';

import type { HomeRecentPersonalRecord } from '../types/home.types';
import { formatRelativeDay } from '../utils/homeFormat';

export interface RecentPersonalRecordsCardProps {
  records: HomeRecentPersonalRecord[];
}

/** How many recent PRs the Home section shows. */
const MAX_RECORDS = 5;

/**
 * The Home "Personal Records" section: the latest PRs as rows inside one
 * card — exercise name and date on the left, the record value on the right.
 */
export const RecentPersonalRecordsCard = React.memo(function RecentPersonalRecordsCardBase({
  records,
}: RecentPersonalRecordsCardProps) {
  const visible = records.slice(0, MAX_RECORDS);

  return (
    <Card>
      {visible.map((record, index) => (
        <React.Fragment key={`${record.exerciseId}:${record.achievedAt}`}>
          {index > 0 ? <Divider /> : null}
          <View
            style={styles.row}
            accessible
            accessibilityLabel={`${record.exerciseName}: ${formatPersonalRecordValue(record)}, ${
              formatRelativeDay(record.achievedAt) || 'date unknown'
            }`}
          >
            <View style={styles.info}>
              <Text variant="subtitle" numberOfLines={2} style={styles.exercise}>
                {record.exerciseName}
              </Text>
              <Text variant="caption" color="textSecondary" style={styles.date}>
                {formatRelativeDay(record.achievedAt)}
              </Text>
            </View>
            <Text variant="subtitle" color="primary" style={styles.value}>
              {formatPersonalRecordValue(record)}
            </Text>
          </View>
        </React.Fragment>
      ))}
    </Card>
  );
});

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.lg,
    paddingVertical: spacing.md,
  },
  info: {
    flex: 1,
  },
  exercise: {
    textTransform: 'capitalize',
  },
  date: {
    marginTop: spacing.xxs,
  },
  value: {
    flexShrink: 0,
  },
});
