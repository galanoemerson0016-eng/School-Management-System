import depedLogoLeft from '../../assets/deped_logo_left.png?inline';
import schoolLogoFallback from '../../assets/school-logo.png?inline';

// Logos inlined as base64 data URIs because the packaged app runs on file://,
// where react-pdf's fetch()-based image loader cannot reach local files.
// Keep this module lazily imported so the base64 payload stays out of the main bundle.
export const certificateAssets = {
  depedLogoLeft,
  schoolLogoFallback
};
