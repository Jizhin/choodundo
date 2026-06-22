import axios from "axios";
import type {
  ActiveLocation,
  DistrictReportsResponse,
  DistrictsResponse,
  FeedItem,
  HourlyBucket,
  LiveStats,
  LocationResolved,
  PlaceSearchResult,
  ReportStatus,
  ReportSubmitResponse,
} from "../types";

const BASE = import.meta.env.VITE_API_BASE_URL ?? "";

const api = axios.create({
  baseURL: `${BASE}/api`,
  timeout: 12000,
});

export async function fetchFeed(limit = 50): Promise<FeedItem[]> {
  const { data } = await api.get<FeedItem[]>("/feed", { params: { limit } });
  return data;
}

export async function fetchDistricts(): Promise<DistrictsResponse> {
  const { data } = await api.get<DistrictsResponse>("/districts");
  return data;
}

export async function fetchStats(): Promise<LiveStats> {
  const { data } = await api.get<LiveStats>("/stats");
  return data;
}

export async function submitReport(
  status: ReportStatus,
  location: ActiveLocation
): Promise<ReportSubmitResponse> {
  const { data } = await api.post<ReportSubmitResponse>("/reports", {
    status,
    place_name: location.place_name,
    district: location.district,
    pincode: location.pincode ?? null,
    latitude: location.latitude ?? null,
    longitude: location.longitude ?? null,
  });
  return data;
}

export async function searchPlaces(q: string): Promise<PlaceSearchResult[]> {
  const { data } = await api.get<PlaceSearchResult[]>("/search", { params: { q } });
  return data;
}

export async function fetchHourlyStats(): Promise<HourlyBucket[]> {
  const { data } = await api.get<HourlyBucket[]>("/stats/hourly");
  return data;
}

export async function fetchDistrictReports(
  district: string,
  limit = 50,
  offset = 0,
  place?: string
): Promise<DistrictReportsResponse> {
  const params: Record<string, unknown> = { district, limit, offset };
  if (place) params.place = place;
  const { data } = await api.get<DistrictReportsResponse>("/district-reports", { params });
  return data;
}

export async function detectLocation(
  lat: number,
  lon: number
): Promise<LocationResolved> {
  const { data } = await api.get<LocationResolved>("/location", {
    params: { lat, lon },
  });
  return data;
}
