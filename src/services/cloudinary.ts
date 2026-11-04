const CLOUD_NAME = process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

// Uploads a local image or PDF to Cloudinary and returns its web address.
// XMLHttpRequest is used because the newer fetch cannot send local files from a phone.
export function uploadToCloudinary(
  uri: string,
  mimeType: string,
  fileName: string
): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!CLOUD_NAME || !UPLOAD_PRESET) {
      reject(new Error('Cloudinary is not set up. Add the two values to .env and restart the server.'));
      return;
    }

    const form = new FormData();
    form.append('file', { uri, name: fileName, type: mimeType } as unknown as Blob);
    form.append('upload_preset', UPLOAD_PRESET);

    const xhr = new XMLHttpRequest();
    xhr.open('POST', `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/auto/upload`);
    xhr.timeout = 60000;

    xhr.onload = () => {
      let json: any = null;
      try {
        json = JSON.parse(xhr.responseText);
      } catch {
        // Not JSON: show the start of what came back.
      }
      if (xhr.status >= 200 && xhr.status < 300 && json?.secure_url) {
        resolve(json.secure_url as string);
        return;
      }
      const detail = json?.error?.message ?? xhr.responseText?.slice(0, 150) ?? '';
      reject(new Error(`Upload failed (status ${xhr.status}): ${detail}`));
    };
    xhr.onerror = () => reject(new Error('Upload failed: network error. Check your internet connection.'));
    xhr.ontimeout = () => reject(new Error('Upload took too long. Check your internet connection.'));

    xhr.send(form);
  });
}