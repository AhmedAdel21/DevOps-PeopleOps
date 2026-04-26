/** Domain shape — what the picker UI hands the repository to upload. */
export interface LocalAttachment {
  uri: string;
  fileName: string;
  contentType: string;
  sizeBytes: number;
}

/** Result shape returned by upload — used for both display and submission. */
export interface UploadedAttachment {
  id: string;
  fileName: string;
  contentType: string;
  sizeBytes: number;
}

/**
 * Repository for the shared file-attachment subsystem. Used by both the
 * leave and permission flows: the form keeps a list of UploadedAttachment
 * and sends each `id` in the parent request's `attachmentIds`.
 */
export interface AttachmentRepository {
  /** Upload a single local file to the staging endpoint. */
  uploadAttachment(file: LocalAttachment): Promise<UploadedAttachment>;

  /** Returns a short-lived URL the device can use to fetch the bytes. */
  getDownloadUrl(attachmentId: string): Promise<string>;

  /** Best-effort deletion of an unsubmitted (Staged) attachment. */
  deleteStagedAttachment(attachmentId: string): Promise<void>;
}
