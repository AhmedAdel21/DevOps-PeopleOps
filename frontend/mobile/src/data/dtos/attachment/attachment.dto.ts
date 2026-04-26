/** Returned by `POST /api/attachments` after a successful upload. */
export interface AttachmentMetadataDto {
  id: string;
  fileName: string;
  contentType: string;
  sizeBytes: number;
}

/** Returned by `GET /api/attachments/{id}/download` — short-lived SAS URL. */
export interface AttachmentDownloadDto {
  url: string;
}
