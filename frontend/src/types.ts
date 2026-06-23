export type ReportStatus = "HOT" | "NORMAL" | "EXTREME_HOT";

export type DistrictLevel = "RED" | "ORANGE" | "GRAY";

export interface FeedItem {
  id: string;
  status: ReportStatus;
  name: string;
  place: string;
  district: string;
  created_at: string;
  time: string;
  display_label?: string; // "EXTREME HOT" for locally-submitted extreme reports
}

export interface DistrictSummary {
  district: string;
  total: number;
  hot: number;
  extreme_hot: number;
  normal: number;
  hot_percentage: number;
  level: DistrictLevel;
  hourly: number[];  // hot counts per IST hour (0-23) for last 24h
  latest_report?: FeedItem | null;
}

export interface DistrictsResponse {
  districts: DistrictSummary[];
  total_reports: number;
  updated_at: string;
}

export interface PlaceSearchResult {
  place_name: string;
  district: string;
  pincode?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}

export interface LocationResolved {
  place_name: string;
  district: string;
  pincode?: string | null;
  latitude: number;
  longitude: number;
}

export interface ReportSubmitResponse {
  success: boolean;
  accepted: boolean;
  message: string;
  report?: FeedItem | null;
}

export interface LiveStats {
  reports_last_2h: number;
  reports_today: number;
  last_report_at?: string | null;
}

export interface ActiveLocation {
  place_name: string;
  district: string;
  pincode?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}

export interface DistrictReportItem {
  id: string;
  status: ReportStatus;
  place: string;
  district: string;
  created_at: string;
  time: string;
}

export interface DistrictReportsResponse {
  reports: DistrictReportItem[];
  total: number;
  places: string[];
  district: string;
}

export interface HourlyBucket {
  hour: number;
  hot: number;
  normal: number;
}

// WebSocket event payloads.
export type WsEvent =
  | ({ type: "NEW_REPORT" } & FeedItem)
  | { type: "DISTRICT_UPDATE"; district: string; hot_percentage: number }
  | { type: "CONNECTED"; clients: number };
