import type {
  AttachmentRepository,
  LocalAttachment,
  UploadedAttachment,
} from '@/domain/repositories';
import type { AttachmentRemoteDataSource } from '@/data/data_sources/attachment';
import { attendanceLog } from '@/core/logger';

export class AttachmentRepositoryImpl implements AttachmentRepository {
  constructor(private readonly ds: AttachmentRemoteDataSource) {}

  async uploadAttachment(file: LocalAttachment): Promise<UploadedAttachment> {
    attendanceLog.info(
      'repository',
      `uploadAttachment called (${file.fileName}, ${file.sizeBytes} bytes)`,
    );
    const dto = await this.ds.uploadFile({
      uri: file.uri,
      fileName: file.fileName,
      contentType: file.contentType,
      sizeBytes: file.sizeBytes,
    });
    return {
      id: dto.id,
      fileName: dto.fileName,
      contentType: dto.contentType,
      sizeBytes: dto.sizeBytes,
    };
  }

  async getDownloadUrl(attachmentId: string): Promise<string> {
    const { url } = await this.ds.getDownloadUrl(attachmentId);
    return url;
  }

  async deleteStagedAttachment(attachmentId: string): Promise<void> {
    try {
      await this.ds.deleteStaged(attachmentId);
    } catch (e) {
      // Best-effort: a failed cleanup is not user-visible. The 24h GC
      // sweep on the backend will eventually catch it.
      attendanceLog.warn('repository', `deleteStagedAttachment(${attachmentId}) failed`, e);
    }
  }
}
