/** Snapshot fields the backend embeds on a permission request when files are attached. */
export interface AttachmentSnapshotDto {
  id: string;
  fileName: string;
  contentType: string;
  sizeBytes: number;
}

/** Returned by GET /api/leave/permissions/quota. */
export interface PermissionQuotaDto {
  permissionsUsed: number;
  permissionsAllowed: number;
  monthResetsAt: string;   // yyyy-MM-dd
}

export interface PermissionRequestDto {
  id: string;
  permissionType: string;  // 'Late' | 'Early' | 'MiddleDay' | 'HalfDay'
  date: string;            // yyyy-MM-dd
  startTime: string;       // HH:mm
  endTime: string;         // HH:mm
  durationMinutes: number;
  notes?: string | null;
  status: string;          // 'Approved' | 'Pending' | 'Rejected' | 'Cancelled'
  attachments?: AttachmentSnapshotDto[];
}

export interface PermissionRequestsResponseDto {
  items: PermissionRequestDto[];
  nextCursor: string | null;
}

export interface CreatePermissionRequestDto {
  permissionType: string;
  date: string;       // yyyy-MM-dd
  startTime: string;  // HH:mm
  endTime: string;    // HH:mm
  notes?: string;
  /** Ids returned by POST /api/attachments. Wired up in Phase B (file picker). */
  attachmentIds?: string[];
}
