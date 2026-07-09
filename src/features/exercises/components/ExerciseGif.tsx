import React, { useState } from 'react';
import { Image, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { DumbbellIcon } from '@/components/icons/TabIcons';
import { Loader, Text } from '@/components/ui';
import { colors, radius, spacing } from '@/theme';

export interface ExerciseGifProps {
  /** Animated demonstration. Falls back to `imageUrl` if it fails to load. */
  gifUrl?: string;
  /** Static frame used while the gif loads or if it errors. */
  imageUrl?: string;
  style?: StyleProp<ViewStyle>;
}

const PLACEHOLDER_ICON_SIZE = 40;

/**
 * Looping demonstration player for an exercise. Animated GIFs play natively on
 * iOS and on Android via the Fresco animated-gif dependency. Degrades to the
 * static image, then to a placeholder, so the tile is never blank.
 */
export const ExerciseGif = React.memo(function ExerciseGifBase({
  gifUrl,
  imageUrl,
  style,
}: ExerciseGifProps) {
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  const uri = !failed && gifUrl ? gifUrl : imageUrl;

  return (
    <View style={[styles.container, style]}>
      {uri ? (
        <Image
          source={{ uri }}
          style={styles.image}
          resizeMode="contain"
          accessibilityLabel="Exercise demonstration"
          onLoadStart={() => setLoading(true)}
          onLoadEnd={() => setLoading(false)}
          onError={() => {
            // A failed gif falls back to the static image; a failed image ends here.
            setLoading(false);
            setFailed(true);
          }}
        />
      ) : (
        <View style={styles.placeholder}>
          <DumbbellIcon color={colors.textDisabled} size={PLACEHOLDER_ICON_SIZE} />
          <Text variant="bodySmall" color="textDisabled" style={styles.placeholderText}>
            No preview available
          </Text>
        </View>
      )}
      {uri && loading ? (
        <View style={styles.loaderOverlay} pointerEvents="none">
          <Loader />
        </View>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: radius.xl,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.surface,
  },
  placeholder: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  placeholderText: {
    textAlign: 'center',
  },
  loaderOverlay: {
    ...(StyleSheet.absoluteFill as object),
    alignItems: 'center',
    justifyContent: 'center',
  },
});
