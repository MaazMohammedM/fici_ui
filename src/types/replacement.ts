export type ReplacementReasonCode = 
  | 'size_mismatch'
  | 'damaged'
  | 'wrong_item'
  | 'quality_issue'
  | 'other';

export interface ReplacementRequestData {
  reason_code: ReplacementReasonCode;
  reason?: string;
  requested_size?: string | null;
}

export interface ReplacementRequestPayload {
  action: 'request_replacement';
  order_item_id: string;
  reason_code: ReplacementReasonCode;
  reason?: string | null;
  requested_size?: string | null;
  guestSessionId?: string;
}
