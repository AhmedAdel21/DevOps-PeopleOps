export interface PermissionRequestDto {
  id: string;
  permissionType: string;  // 'Late' | 'Early' | 'MiddleDay' | 'HalfDay'
  date: string;            // yyyy-MM-dd
  startTime: string;       // HH:mm
  endTime: string;         // HH:mm
  durationMinutes: number;
  status: string;          // 'Approved' | 'Pending' | 'Rejected' | 'Cancelled'
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
}
