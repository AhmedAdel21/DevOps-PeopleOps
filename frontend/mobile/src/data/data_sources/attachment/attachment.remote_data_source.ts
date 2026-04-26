import type { HttpClient } from '@/data/data_sources/http';
import type { AttachmentMetadataDto, AttachmentDownloadDto } from '@/data/dtos/attachment';
import { attendanceLog } from '@/core/logger';

const ATTACHMENTS_PATH = '/api/attachments';

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
 */
export class AttachmentRemoteDataSource {
  constructor(private readonly http: HttpClient) {}

  async uploadFile(file: LocalAttachmentFile): Promise<AttachmentMetadataDto> {
    attendanceLog.info(
      'data_source',
      `POST ${ATTACHMENTS_PATH} (file=${file.fileName}, ${file.sizeBytes} bytes)`,
    );

    // RN's FormData accepts { uri, type, name } objects directly — fetch
    // streams the file from disk without loading it into JS memory.
    const form = new FormData();
    form.append('file', {
      uri: file.uri,
      name: file.fileName,
      type: file.contentType,
    } as unknown as Blob);

    return this.http.postMultipart<AttachmentMetadataDto>(ATTACHMENTS_PATH, form);
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
