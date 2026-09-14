import { GeoData, QueryAnalysis, QueryRecord } from "../types";
import { api } from "./client";

export async function getQueryHistory(
  repository: string
): Promise<QueryRecord[]> {
  const response = await api.get<QueryRecord[]>("/saved-queries", {
    params: { repository },
  });
  return response.data;
}

export async function addQueryToHistory(
  repository: string,
  query: string,
  name: string
) {
  return api.post("/saved-queries", {
    name,
    sparql: query,
    repository,
  });
}

export async function clearQueryHistory(repository: string) {
  return api.delete("/saved-queries", {
    params: { repository },
  });
}

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
