export interface LeaveRequestDto {
  id: string;
  leaveType: string;    // 'Annual' | 'Casual' | 'Sick'
  fromDate: string;     // yyyy-MM-dd
  toDate: string;       // yyyy-MM-dd
  durationDays: number;
  status: string;       // 'Approved' | 'Pending' | 'Rejected' | 'Cancelled'
}

export interface LeaveRequestsResponseDto {
  items: LeaveRequestDto[];
  nextCursor: string | null;
}

export interface CreateLeaveRequestDto {
  leaveType: string;
  fromDate: string;
  toDate: string;
}

export interface LeaveErrorBodyDto {
  code?: string;
  message?: string;
}
