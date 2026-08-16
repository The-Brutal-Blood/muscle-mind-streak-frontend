import { z } from 'zod';

/** Single source of truth for help-request form validation and its bounds. */

export const HELP_TITLE_MAX_LENGTH = 120;
export const HELP_DESCRIPTION_MAX_LENGTH = 2000;
/** The backend accepts at most three images per request. */
export const HELP_MAX_IMAGES = 3;

export const helpRequestSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'Enter a short title')
    .max(HELP_TITLE_MAX_LENGTH, `Keep it under ${HELP_TITLE_MAX_LENGTH} characters`),
  description: z
    .string()
    .trim()
    .min(1, 'Add a few details')
    .max(HELP_DESCRIPTION_MAX_LENGTH, `Keep it under ${HELP_DESCRIPTION_MAX_LENGTH} characters`),
});

export type HelpRequestFormValues = z.infer<typeof helpRequestSchema>;
