import { GeoData, QueryAnalysis } from "../types";
import { api } from "./client";

export async function getQueryAnalysis(
  query: string,
  repository: string,
  signal?: AbortSignal
): Promise<QueryAnalysis> {
  const response = await api.get<QueryAnalysis>("/analysis", {
    params: { repository, query },
    signal,
  });
  return response.data;
}

export async function getGeoJSON(region: string): Promise<GeoData> {
  const response = await api.get<{ geoData: GeoData }>("/geo", {
    params: { region },
  });
  return response.data.geoData;
}

export async function isGeographic(text: string): Promise<boolean> {
  const response = await api.get<{ valid: boolean }>("/geo/valid", {
    params: { text },
  });
  return response.data.valid;
}
