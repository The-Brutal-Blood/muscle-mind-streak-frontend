import React from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';

import { CloseIcon, PlusIcon } from '@/components/icons/ActionIcons';
import { Text } from '@/components/ui';
import { colors, radius, spacing } from '@/theme';

import type { HelpAttachment } from '../types/help.types';
import { HELP_MAX_IMAGES } from '../validation/help.schema';

export interface AttachmentPickerProps {
  images: HelpAttachment[];
  /** Opens the device photo library. Disabled once the max is reached. */
  onAdd: () => void;
  onRemove: (uri: string) => void;
  disabled?: boolean;
}

const THUMBNAIL_SIZE = 76;

/**
 * Optional screenshot attachments for a help request: thumbnails of what has
 * been picked, each removable, plus an add tile until the backend's limit of
 * three images is reached.
 */
export const AttachmentPicker = React.memo(function AttachmentPickerBase({
  images,
  onAdd,
  onRemove,
  disabled = false,
}: AttachmentPickerProps) {
  const atLimit = images.length >= HELP_MAX_IMAGES;

  return (
    <View>
      <View style={styles.labelRow}>
        <Text variant="label" color="textSecondary">
          Screenshots
        </Text>
        <Text variant="caption" color="textSecondary">
          {images.length}/{HELP_MAX_IMAGES}
        </Text>
      </View>

      <View style={styles.tiles}>
        {images.map(image => (
          <View key={image.uri} style={styles.thumbnailWrap}>
            <Image
              source={{ uri: image.uri }}
              style={styles.thumbnail}
              resizeMode="cover"
              accessible
              accessibilityRole="image"
              accessibilityLabel={image.name}
            />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Remove ${image.name}`}
              onPress={() => onRemove(image.uri)}
              disabled={disabled}
              hitSlop={spacing.sm}
              style={({ pressed }) => [styles.remove, pressed && styles.removePressed]}
            >
              <CloseIcon color={colors.textPrimary} size={14} />
            </Pressable>
          </View>
        ))}

        {atLimit ? null : (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Add screenshot"
            accessibilityHint={`Attach up to ${HELP_MAX_IMAGES} images from your photo library`}
            accessibilityState={{ disabled }}
            onPress={onAdd}
            disabled={disabled}
            style={({ pressed }) => [
              styles.addTile,
              pressed && styles.addTilePressed,
              disabled && styles.addTileDisabled,
            ]}
          >
            <PlusIcon color={colors.textSecondary} size={22} />
          </Pressable>
        )}
      </View>

      <Text variant="caption" color="textSecondary" style={styles.helper}>
        {atLimit
          ? `Maximum of ${HELP_MAX_IMAGES} images reached.`
          : `Optional — attach up to ${HELP_MAX_IMAGES} images.`}
      </Text>
    </View>
  );
});

const styles = StyleSheet.create({
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  tiles: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  thumbnailWrap: {
    width: THUMBNAIL_SIZE,
    height: THUMBNAIL_SIZE,
  },
  thumbnail: {
    width: '100%',
    height: '100%',
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  remove: {
    position: 'absolute',
    top: -spacing.sm,
    right: -spacing.sm,
    width: 24,
    height: 24,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
  },
  removePressed: {
    backgroundColor: colors.surface,
  },
  addTile: {
    width: THUMBNAIL_SIZE,
    height: THUMBNAIL_SIZE,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
  },
  addTilePressed: {
    backgroundColor: colors.surfaceElevated,
  },
  addTileDisabled: {
    opacity: 0.45,
  },
  helper: {
    marginTop: spacing.sm,
  },
});
