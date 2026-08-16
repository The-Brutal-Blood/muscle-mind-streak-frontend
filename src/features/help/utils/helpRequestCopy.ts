import type { HelpRequestKind } from '../types/help.types';

/**
 * The two help flows share one form; only the wording differs. Keeping the
 * copy here is what makes the shared form configurable rather than duplicated.
 */
export interface HelpRequestCopy {
  screenTitle: string;
  intro: string;
  titleLabel: string;
  titlePlaceholder: string;
  descriptionLabel: string;
  descriptionPlaceholder: string;
  submitLabel: string;
  successMessage: string;
}

export const HELP_REQUEST_COPY: Record<HelpRequestKind, HelpRequestCopy> = {
  REPORT_BUG: {
    screenTitle: 'Report a Bug',
    intro: 'Tell us what went wrong and we will look into it.',
    titleLabel: 'Title',
    titlePlaceholder: 'Workout timer resets on background',
    descriptionLabel: 'Description',
    descriptionPlaceholder: 'What happened, and what did you expect instead?',
    submitLabel: 'Submit Bug Report',
    successMessage: 'Bug report submitted successfully.',
  },
  SUGGEST_FEATURE: {
    screenTitle: 'Suggest a Feature',
    intro: 'Tell us what would make the app better for your training.',
    titleLabel: 'Title',
    titlePlaceholder: 'Add supersets to routines',
    descriptionLabel: 'Description',
    descriptionPlaceholder: 'What would you like to see, and how would you use it?',
    submitLabel: 'Submit Suggestion',
    successMessage: 'Feature suggestion submitted successfully.',
  },
};
