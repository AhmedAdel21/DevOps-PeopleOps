/** Returned by `POST /api/v1/attachments` after a successful upload. */
export interface AttachmentMetadataDto {
  id: string;
  fileName: string;
  contentType: string;
  sizeBytes: number;
}

/** Returned by `GET /api/v1/attachments/{id}/download` — short-lived SAS URL. */
export interface AttachmentDownloadDto {
  url: string;
}
