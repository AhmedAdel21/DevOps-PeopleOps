/** One uploaded file row inside AttachmentUploadResponse.Items on the BE. */
export interface AttachmentUploadItemDto {
  id: string;            // base filename without directory prefix
  fileName: string;
  url: string;           // public blob URL
  contentType: string;
  fileSize: number;
}

/**
 * Wire shape returned by `POST /api/v1/attachments`. The BE returns a
 * wrapper around an array of uploaded files. The data source unwraps to
 * a single AttachmentMetadataDto for the legacy mobile contract.
 */
export interface AttachmentUploadResponseDto {
  items: AttachmentUploadItemDto[];
}

/** Mobile-facing single-item shape — the data source synthesises this
 *  from response.items[0]. */
export interface AttachmentMetadataDto {
  id: string;
  fileName: string;
  contentType: string;
  sizeBytes: number;
  /** Public URL the client can use to fetch the file directly. */
  url?: string;
}

/**
 * `GET /api/v1/attachments/{id}/download` on the new BE STREAMS the file
 * (binary body). The data source either downloads the bytes or builds a
 * pseudo-DTO with the public URL from upload time. We keep the shape so
 * existing UI bindings work.
 */
export interface AttachmentDownloadDto {
  url: string;
}
