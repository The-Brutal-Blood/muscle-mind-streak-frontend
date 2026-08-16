import React, { useCallback, useRef, useState } from 'react';
import { Alert, StyleSheet, View, type TextInput as RNTextInput } from 'react-native';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';

import { Button, Input, Text } from '@/components/ui';
import { colors, radius, spacing } from '@/theme';
import { pickImages } from '@/utils/imagePicker';

import { AttachmentPicker } from './AttachmentPicker';
import { useSubmitHelpRequest } from '../hooks/useSubmitHelpRequest';
import type { HelpAttachment, HelpRequestKind } from '../types/help.types';
import { HELP_REQUEST_COPY } from '../utils/helpRequestCopy';
import {
  HELP_DESCRIPTION_MAX_LENGTH,
  HELP_MAX_IMAGES,
  HELP_TITLE_MAX_LENGTH,
  helpRequestSchema,
  type HelpRequestFormValues,
} from '../validation/help.schema';

export interface HelpRequestFormProps {
  kind: HelpRequestKind;
  /** Fired after a successful submit, once the user dismisses the confirmation. */
  onSubmitted: () => void;
}

const DESCRIPTION_MIN_HEIGHT = 132;

/**
 * The shared bug-report / feature-suggestion form. Both flows post the same
 * multipart body (title, description, up to three images); only the copy from
 * `HELP_REQUEST_COPY` differs.
 */
export const HelpRequestForm = React.memo(function HelpRequestFormBase({
  kind,
  onSubmitted,
}: HelpRequestFormProps) {
  const copy = HELP_REQUEST_COPY[kind];
  const [images, setImages] = useState<HelpAttachment[]>([]);
  const descriptionRef = useRef<RNTextInput>(null);

  const {
    control,
    handleSubmit,
    reset,
    formState: { isValid },
  } = useForm<HelpRequestFormValues>({
    resolver: zodResolver(helpRequestSchema),
    mode: 'onChange',
    defaultValues: { title: '', description: '' },
  });

  const submit = useSubmitHelpRequest();

  const handleAddImages = useCallback(async () => {
    const remaining = HELP_MAX_IMAGES - images.length;
    if (remaining <= 0) {
      return;
    }
    const result = await pickImages(remaining);
    if (result.status === 'error') {
      Alert.alert('Could not add images', result.message);
      return;
    }
    if (result.status === 'cancelled') {
      return;
    }
    setImages(current => {
      // Re-read from `current` so the cap holds even if a removal raced this pick.
      const existing = new Set(current.map(image => image.uri));
      const additions = result.images.filter(image => !existing.has(image.uri));
      return [...current, ...additions].slice(0, HELP_MAX_IMAGES);
    });
  }, [images.length]);

  const handleRemoveImage = useCallback((uri: string) => {
    setImages(current => current.filter(image => image.uri !== uri));
  }, []);

  const onSubmit = handleSubmit(values => {
    if (submit.isPending) {
      return;
    }
    submit.mutate(
      { kind, title: values.title, description: values.description, images },
      {
        onSuccess: () => {
          // Only cleared on success; a failed submit keeps everything typed.
          reset({ title: '', description: '' });
          setImages([]);
          Alert.alert(
            'Thank you',
            copy.successMessage,
            [{ text: 'OK', onPress: onSubmitted }],
            // Not cancelable so dismissing can't strand the user on an empty form.
            { cancelable: false },
          );
        },
      },
    );
  });

  return (
    <View style={styles.form}>
      <Controller
        control={control}
        name="title"
        render={({ field: { value, onChange, onBlur }, fieldState: { error } }) => (
          <Input
            label={copy.titleLabel}
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            error={error?.message}
            placeholder={copy.titlePlaceholder}
            maxLength={HELP_TITLE_MAX_LENGTH}
            editable={!submit.isPending}
            returnKeyType="next"
            onSubmitEditing={() => descriptionRef.current?.focus()}
            accessibilityHint="A short summary in one line"
          />
        )}
      />

      <Controller
        control={control}
        name="description"
        render={({ field: { value, onChange, onBlur }, fieldState: { error } }) => (
          <Input
            ref={descriptionRef}
            label={copy.descriptionLabel}
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            error={error?.message}
            placeholder={copy.descriptionPlaceholder}
            maxLength={HELP_DESCRIPTION_MAX_LENGTH}
            editable={!submit.isPending}
            multiline
            textAlignVertical="top"
            inputStyle={styles.description}
            accessibilityHint="Describe it in as much detail as you can"
          />
        )}
      />

      <AttachmentPicker
        images={images}
        onAdd={handleAddImages}
        onRemove={handleRemoveImage}
        disabled={submit.isPending}
      />

      {submit.isError ? (
        <View style={styles.errorBox} accessibilityRole="alert" accessibilityLiveRegion="polite">
          <Text variant="bodySmall" color="error">
            {submit.error.message}
          </Text>
        </View>
      ) : null}

      <Button
        label={copy.submitLabel}
        variant="primary"
        size="lg"
        fullWidth
        loading={submit.isPending}
        disabled={!isValid || submit.isPending}
        onPress={onSubmit}
        accessibilityLabel={copy.submitLabel}
        accessibilityHint="Sends this to the Muscle Mind Streak team"
        style={styles.submit}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  form: {
    gap: spacing.xl,
  },
  description: {
    minHeight: DESCRIPTION_MIN_HEIGHT,
  },
  errorBox: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.error,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  submit: {
    marginTop: spacing.sm,
  },
});
