import axios from "axios";
import { QueryAnalysis, QueryRecord, geoJSON } from "../types";

const BACKEND_API = process.env.REACT_APP_BACKEND_API;

export async function getQueryHistory(
  repository: string,
  username: string
): Promise<QueryRecord[]> {
  try {
    const endpoint = `${BACKEND_API}/saved-queries?repository=${repository}&username=${encodeURIComponent(
      username
    )}`;
    const response = await axios.get(endpoint);
    const queries = response.data;
    return queries;
  } catch (error) {
    console.log(error);
  }
  return [];
}

export async function addQueryToHistory(
  repository: string,
  query: string,
  name: string,
  username: string
) {
  try {
    const endpoint = `${BACKEND_API}/saved-queries`;
    const response = await axios.post(endpoint, {
      name,
      sparql: query,
      repository,
      username,
    });
    return response;
  } catch (error) {
    console.log(error);
  }
  return "";
}

export async function clearQueryHistory(repository: string, username: string) {
  try {
    const endpoint = `${BACKEND_API}/saved-queries`;
    const response = await axios.delete(endpoint, {
      params: {
        repository,
        username,
      },
    });
    return response;
  } catch (error) {
    console.log(error);
  }
  return [];
}

export async function getQueryAnalysis(
  query: string,
  repository: string,
  username: string
): Promise<QueryAnalysis> {
  try {
    const endpoint = `${BACKEND_API}/analysis?repository=${encodeURIComponent(
      repository
    )}&query=${encodeURIComponent(query)}&username=${encodeURIComponent(
      username
    )}`;
    const response = await axios.get(endpoint);
    return response.data;
  } catch (error) {
    console.log(error);
  }
  return {
    pattern: null,
    visualisations: [],
    variables: {
      key: [],
      scalar: [],
      geographical: [],
      temporal: [],
      lexical: [],
      date: [],
      numeric: [],
    },
  };
}

export async function getGeoJSON(name: string): Promise<{ data: geoJSON | null }> {
  try {
    const endpoint = `${BACKEND_API}/geo`;
    const response = await axios.get(endpoint, {
      params: {
        name,
      },
    });
    return response.data;
  } catch (error) {
    console.log(error);
  }
  return { data: null };
}
