/**
 * Triggers a direct file download of Sampark.apk on Android and desktop browsers.
 * Uses Blob with Android package MIME type to prevent browsers from displaying
 * raw binary characters in the window.
 */
export async function downloadSamparkApk(): Promise<boolean> {
  try {
    const response = await fetch('/Sampark.apk');
    if (!response.ok) {
      throw new Error(`Failed to fetch APK: ${response.statusText}`);
    }

    const buffer = await response.arrayBuffer();
    const blob = new Blob([buffer], {
      type: 'application/vnd.android.package-archive',
    });

    const blobUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = 'Sampark.apk';
    link.style.display = 'none';

    document.body.appendChild(link);
    link.click();

    setTimeout(() => {
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    }, 5000);

    return true;
  } catch (error) {
    console.error('Direct blob download error, falling back to window.location:', error);
    // Fallback: direct browser navigation to APK endpoint
    window.location.href = '/Sampark.apk';
    return false;
  }
}
