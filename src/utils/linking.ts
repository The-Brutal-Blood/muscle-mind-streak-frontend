import { Alert, Linking } from 'react-native';

/**
 * Opens a URL outside the app (browser, mail client, …). Failures surface as
 * an Alert, matching how the rest of the app reports recoverable errors.
 */
export async function openExternalUrl(url: string, failureTitle = 'Could not open link') {
  try {
    await Linking.openURL(url);
  } catch {
    Alert.alert(failureTitle, 'No app on this device can open it.');
  }
}

/** Opens the device mail composer addressed to `email`. */
export async function openEmail(email: string, subject?: string) {
  const query = subject ? `?subject=${encodeURIComponent(subject)}` : '';
  await openExternalUrl(`mailto:${email}${query}`, 'Could not open your mail app');
}
