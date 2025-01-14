import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebase';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export class FileUploadError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'FileUploadError';
  }
}

export async function uploadFile(
  file: File,
  userId: string,
  folder: string
): Promise<string> {
  try {
    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      throw new FileUploadError('File size exceeds 5MB limit');
    }

    // Create a reference with a unique name
    const fileName = `${Date.now()}_${file.name}`;
    const fileRef = ref(storage, `${folder}/${userId}/${fileName}`);

    // Upload the file
    await uploadBytes(fileRef, file);

    // Get the download URL
    const downloadUrl = await getDownloadURL(fileRef);
    return downloadUrl;
  } catch (error) {
    console.error('File upload error:', error);
    if (error instanceof FileUploadError) {
      throw error;
    }
    throw new FileUploadError('Failed to upload file');
  }
}