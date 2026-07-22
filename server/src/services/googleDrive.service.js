import fs from 'fs';
import path from 'path';
import { getGoogleDriveClient } from '../config/googleDrive.js';
import { driveLogger } from '../config/winston.js';

/**
 * Helper delay function for exponential backoff
 */
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Upload a local file to Google Drive with exponential backoff retry logic
 * Automatically deletes the local file post-upload.
 */
export const uploadFileToDrive = async ({
  filePath,
  fileName,
  mimeType = 'video/webm',
  onProgress = null,
  maxRetries = 3,
}) => {
  const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
  const drive = getGoogleDriveClient();

  if (!fs.existsSync(filePath)) {
    const errorMsg = `File to upload does not exist at path: ${filePath}`;
    driveLogger.error(errorMsg);
    throw new Error(errorMsg);
  }

  const fileSize = fs.statSync(filePath).size;
  driveLogger.info(`Initiating upload for file: ${fileName} (${fileSize} bytes)`);

  // If GDrive client is not configured, simulate upload in dev mode
  if (!drive || !folderId || folderId.startsWith('mock_')) {
    driveLogger.warn('Google Drive credentials missing or mock. Simulating upload & removing temporary local file.');
    let uploaded = 0;
    const chunkSize = Math.max(Math.floor(fileSize / 5), 1024);
    while (uploaded < fileSize) {
      await delay(300);
      uploaded = Math.min(uploaded + chunkSize, fileSize);
      const progress = Math.round((uploaded / fileSize) * 100);
      if (onProgress) onProgress(progress);
      driveLogger.info(`[Mock GDrive Progress] Uploaded: ${progress}%`);
    }

    // Clean up local temp file
    try {
      fs.unlinkSync(filePath);
      driveLogger.info(`Local temp file auto-deleted post-upload: ${filePath}`);
    } catch (cleanupErr) {
      driveLogger.error(`Failed to delete local temp file: ${cleanupErr.message}`);
    }

    return {
      success: true,
      fileId: `mock_drive_file_${Date.now()}`,
      fileName,
      webViewLink: 'https://drive.google.com/file/d/mock_id/view',
      simulated: true,
    };
  }

  // Real Google Drive Upload with Exponential Backoff Retry
  let attempt = 0;
  let lastError = null;

  while (attempt < maxRetries) {
    attempt++;
    try {
      driveLogger.info(`Upload attempt ${attempt} of ${maxRetries} for ${fileName}`);

      const fileMetadata = {
        name: fileName,
        parents: folderId ? [folderId] : [],
      };

      const media = {
        mimeType,
        body: fs.createReadStream(filePath),
      };

      const response = await drive.files.create({
        requestBody: fileMetadata,
        media: media,
        fields: 'id, name, webViewLink, webContentLink',
      }, {
        onUploadProgress: (evt) => {
          if (fileSize > 0) {
            const progress = Math.round((evt.bytesRead / fileSize) * 100);
            if (onProgress) onProgress(progress);
            driveLogger.info(`Upload progress for ${fileName}: ${progress}%`);
          }
        },
      });

      driveLogger.info(`Google Drive upload successful. File ID: ${response.data.id}`);

      // Clean up local file after successful upload
      try {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          driveLogger.info(`Cleaned up temporary server file post-upload: ${filePath}`);
        }
      } catch (cleanupError) {
        driveLogger.error(`Error deleting temp file ${filePath}: ${cleanupError.message}`);
      }

      return {
        success: true,
        fileId: response.data.id,
        fileName: response.data.name,
        webViewLink: response.data.webViewLink,
      };
    } catch (error) {
      lastError = error;
      driveLogger.error(`Google Drive upload attempt ${attempt} failed: ${error.message}`);
      if (attempt < maxRetries) {
        const backoffTime = Math.pow(2, attempt) * 1000;
        driveLogger.info(`Retrying in ${backoffTime}ms...`);
        await delay(backoffTime);
      }
    }
  }

  // If retries failed, attempt cleanup & throw error
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      driveLogger.info(`Cleaned up temp file after failed upload attempts: ${filePath}`);
    }
  } catch (e) {
    /* ignore cleanup error */
  }

  throw new Error(`Google Drive upload failed after ${maxRetries} attempts: ${lastError.message}`);
};
