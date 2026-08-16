import { launchImageLibrary, type Asset } from 'react-native-image-picker';

/**
 * Thin wrapper over the device photo library. Returns the picker's own file
 * name and MIME type untouched so uploads keep the original format (JPEG,
 * PNG, WebP, HEIC, …) — resizing and conversion are the backend's job.
 */

export interface PickedImage {
  /** Local file URI handed to FormData. */
  uri: string;
  /** Original device file name; never rewritten to a different extension. */
  name: string;
  /** MIME type reported by the picker (image/jpeg, image/heic, …). */
  type: string;
}

export type PickImagesResult =
  | { status: 'picked'; images: PickedImage[] }
  | { status: 'cancelled' }
  | { status: 'error'; message: string };

/** Extension → MIME, used only when the picker omits the asset's type. */
const MIME_BY_EXTENSION: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  heic: 'image/heic',
  heif: 'image/heif',
  gif: 'image/gif',
  bmp: 'image/bmp',
  tif: 'image/tiff',
  tiff: 'image/tiff',
};

/** MIME → extension, used only when the picker omits the asset's file name. */
const EXTENSION_BY_MIME: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/heic': 'heic',
  'image/heif': 'heif',
  'image/gif': 'gif',
  'image/bmp': 'bmp',
  'image/tiff': 'tiff',
};

function extensionOf(fileName: string): string | undefined {
  const match = /\.([a-z0-9]+)$/i.exec(fileName);
  return match ? match[1].toLowerCase() : undefined;
}

/**
 * Both fields are optional in the picker's contract. Each falls back to the
 * other rather than to a hardcoded ".jpg" so the format is never misreported.
 */
function toPickedImage(asset: Asset, index: number): PickedImage | null {
  if (!asset.uri) {
    return null;
  }
  const extension = asset.fileName ? extensionOf(asset.fileName) : undefined;
  const type =
    asset.type ??
    (extension ? MIME_BY_EXTENSION[extension] : undefined) ??
    'application/octet-stream';
  const name = asset.fileName ?? `image-${index + 1}.${EXTENSION_BY_MIME[type] ?? 'img'}`;
  return { uri: asset.uri, name, type };
}

/**
 * Opens the system photo library.
 *
 * @param limit Maximum number of images the user may select in this pass.
 */
export async function pickImages(limit: number): Promise<PickImagesResult> {
  if (limit <= 0) {
    return { status: 'picked', images: [] };
  }

  const response = await launchImageLibrary({
    mediaType: 'photo',
    selectionLimit: limit,
    // 'current' returns the asset as stored on the device (e.g. HEIC stays
    // HEIC) instead of letting iOS transcode it behind our back.
    assetRepresentationMode: 'current',
    includeBase64: false,
  });

  if (response.didCancel) {
    return { status: 'cancelled' };
  }
  if (response.errorCode) {
    return {
      status: 'error',
      message:
        response.errorCode === 'permission'
          ? 'Photo access is turned off. Enable it in Settings to attach images.'
          : response.errorMessage ?? 'Could not open your photo library. Please try again.',
    };
  }

  const images = (response.assets ?? [])
    .map(toPickedImage)
    .filter((image): image is PickedImage => image !== null);

  return { status: 'picked', images };
}
