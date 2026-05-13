import ReactNativeBlobUtil from 'react-native-blob-util';
import type { HttpClient, TokenProvider } from '@/data/data_sources/http';
import type {
  AttachmentMetadataDto,
  AttachmentDownloadDto,
  AttachmentUploadResponseDto,
} from '@/data/dtos/attachment';
import { HttpError } from '@/data/data_sources/http';
import { attendanceLog } from '@/core/logger';

const ATTACHMENTS_PATH = '/api/v1/attachments';

/** A single file picked locally on the device, ready to upload. */
export interface LocalAttachmentFile {
  uri: string;
  fileName: string;
  contentType: string;
  sizeBytes: number;
}

/**
 * Wraps the shared `/api/v1/attachments` endpoints. The new BE wraps the
 * upload response as `{ items: [{ id, fileName, url, contentType, fileSize }] }`
 * — the data source unwraps to the single-item DTO that the leave and
 * permission flows expect. The id returned is the blob's base filename
 * (no directory prefix); the BE re-derives the directory from the
 * extension at download/delete time.
 */
export class AttachmentRemoteDataSource {
  constructor(
    private readonly http: HttpClient,
    private readonly baseUrl: string,
    private readonly tokenProvider: TokenProvider,
  ) {}

  async uploadFile(file: LocalAttachmentFile): Promise<AttachmentMetadataDto> {
    attendanceLog.info(
      'data_source',
      `POST ${ATTACHMENTS_PATH} (file=${file.fileName}, ${file.sizeBytes} bytes, native multipart)`,
    );

    let token: string | null = null;
    try {
      token = await this.tokenProvider();
    } catch (e) {
      attendanceLog.warn('data_source', 'tokenProvider threw, sending upload without auth', e);
    }

    const headers: Record<string, string> = { Accept: 'application/json' };
    if (token) headers.Authorization = `Bearer ${token}`;

    const filePath = file.uri.replace(/^file:\/\//, '');
    const url = `${this.baseUrl}${ATTACHMENTS_PATH}`;

    let response;
    try {
      response = await ReactNativeBlobUtil.fetch(
        'POST',
        url,
        headers,
        [
          {
            name: 'file',
            filename: file.fileName,
            type: file.contentType,
            data: ReactNativeBlobUtil.wrap(filePath),
          },
        ],
      );
    } catch (e) {
      attendanceLog.error('data_source', `× POST ${url} native upload threw`, e);
      throw new HttpError(0, null, 'Network request failed');
    }

    const status = response.respInfo.status;
    const rawText = response.text();
    const text: string = typeof rawText === 'string' ? rawText : await rawText;
    let data: unknown = null;
    if (text && text.length > 0) {
      try { data = JSON.parse(text); } catch { data = text; }
    }

    attendanceLog.info('data_source', `← POST ${url} ${status}`);

    if (status < 200 || status >= 300) {
      throw new HttpError(status, data, `Request failed with status ${status}`);
    }

    // BE wraps responses via AutoWrapper as `{ statusCode, message, result }`
    // — react-native-blob-util doesn't go through HttpClient.request, so the
    // envelope is still on the wire. Detect both shapes for safety.
    const envelope = data as { result?: AttachmentUploadResponseDto } & AttachmentUploadResponseDto;
    const upload = envelope.result ?? envelope;
    const item = upload.items?.[0];
    if (!item) {
      throw new HttpError(status, data, 'Upload response missing items[0]');
    }
    return {
      id: item.id,
      fileName: item.fileName,
      contentType: item.contentType,
      sizeBytes: item.fileSize,
      url: item.url,
    };
  }

  /**
   * The new BE streams the file as the response body (not a JSON URL).
   * For RN we keep the legacy "give me a URL" shape by reconstructing
   * the absolute path the client can hit directly. Since uploads use
   * public blobs, the URL returned by upload() can be cached client-side
   * and used here — but for callers who only have the id, we fall back
   * to the auth-protected download endpoint.
   */
  async getDownloadUrl(attachmentId: string): Promise<AttachmentDownloadDto> {
    const path = `${ATTACHMENTS_PATH}/${encodeURIComponent(attachmentId)}/download`;
    attendanceLog.info('data_source', `Resolving download URL ${path}`);
    return { url: `${this.baseUrl}${path}` };
  }

  async deleteStaged(attachmentId: string): Promise<void> {
    const path = `${ATTACHMENTS_PATH}/${encodeURIComponent(attachmentId)}`;
    attendanceLog.info('data_source', `DELETE ${path}`);
    await this.http.delete<void>(path);
  }
}
