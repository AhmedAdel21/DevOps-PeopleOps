import ReactNativeBlobUtil from 'react-native-blob-util';
import type { HttpClient, TokenProvider } from '@/data/data_sources/http';
import type { AttachmentMetadataDto, AttachmentDownloadDto } from '@/data/dtos/attachment';
import { HttpError } from '@/data/data_sources/http';
import { attendanceLog } from '@/core/logger';

const ATTACHMENTS_PATH = '/api/v1/attachments';

/** A single file picked locally on the device, ready to upload. */
export interface LocalAttachmentFile {
  /** Local URI returned by the document picker (e.g. content://, file://). */
  uri: string;
  fileName: string;
  contentType: string;
  /** Size in bytes — informational only; backend computes its own from the stream. */
  sizeBytes: number;
}

/**
 * Wraps the shared `/api/attachments` endpoints. Used by both the leave and
 * permission flows: pick a file locally → call uploadFile → keep the
 * returned `id` → include it in `attachmentIds` when submitting the parent
 * request.
 *
 * Note: GET / DELETE go through the JSON HttpClient, but `uploadFile` uses
 * `react-native-blob-util` for the multipart POST. RN's JS-side FormData +
 * fetch is brittle on Android — it fails with `Network request failed`
 * before the request leaves the device, even with a valid `file://` URI.
 * Native upload sidesteps the JS FormData polyfill entirely.
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

    // ReactNativeBlobUtil.wrap() expects a raw filesystem path, not a
    // file:// URI — strip the scheme. content:// URIs aren't supported by
    // wrap(); the picker is expected to have already converted via
    // keepLocalCopy on Android.
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
    return data as AttachmentMetadataDto;
  }

  async getDownloadUrl(attachmentId: string): Promise<AttachmentDownloadDto> {
    const path = `${ATTACHMENTS_PATH}/${attachmentId}/download`;
    attendanceLog.info('data_source', `GET ${path}`);
    return this.http.get<AttachmentDownloadDto>(path);
  }

  async deleteStaged(attachmentId: string): Promise<void> {
    const path = `${ATTACHMENTS_PATH}/${attachmentId}`;
    attendanceLog.info('data_source', `DELETE ${path}`);
    await this.http.delete<void>(path);
  }
}
