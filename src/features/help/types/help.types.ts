import type { PickedImage } from '@/utils/imagePicker';

/** GET /help/about — app metadata; the API is the source of truth. */
export interface AboutInfo {
  appName: string;
  version: string;
  description: string;
  supportEmail: string;
  websiteUrl: string;
}

/** The two help flows; each maps to its own endpoint. */
export type HelpRequestKind = 'REPORT_BUG' | 'SUGGEST_FEATURE';

/** One image attached to a help request, straight from the device picker. */
export type HelpAttachment = PickedImage;

/**
 * POST /help/report-bug and POST /help/suggestion share this body; it is sent
 * as multipart/form-data with the fields `title`, `description` and `images`.
 */
export interface HelpRequestPayload {
  kind: HelpRequestKind;
  title: string;
  description: string;
  images: HelpAttachment[];
}
