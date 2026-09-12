import axios from "axios";
import { QueryResults, RepositoryId, RepositoryInfo } from "../types";

const BACKEND_API = import.meta.env.VITE_API_URL ?? "http://localhost:5000";

export async function allRepositories(
  username: string
): Promise<RepositoryInfo[]> {
  try {
    const endpoint = `${BACKEND_API}/repositories?username=${encodeURIComponent(
      username
    )}`;
    const response = await axios.get(endpoint);
    const repositories = response.data;

    return repositories;
  } catch (error) {}
  return [];
}

export async function addRemoteRepository(
  name: string,
  sparqlEndpoint: string,
  description: string,
  username: string
): Promise<string> {
  try {
    const endpoint = `${BACKEND_API}/repositories/remote`;
    const response = await axios.post(endpoint, {
      name,
      endpoint: sparqlEndpoint,
      description,
      username,
    });
    const repository_id = response.data;
    return repository_id;
  } catch (error) {}
  return "";
}

export async function addLocalRepository(
  name: string,
  dataUrl: string,
  schemaUrl: string,
  description: string,
  username: string
): Promise<string> {
  try {
    const endpoint = `${BACKEND_API}/repositories/local`;
    const response = await axios.post(endpoint, {
      name,
      dataUrl,
      schemaUrl,
      description,
      username,
    });
    const repository_id = response.data;
    return repository_id;
  } catch (error) {}
  return "";
}

export async function deleteRepository(
  repository: string,
  username: string
): Promise<string> {
  try {
    const endpoint = `${BACKEND_API}/repositories`;
    const response = await axios.delete(endpoint, {
      params: { repository, username },
    });
    const repository_id = response.data;
    return repository_id;
  } catch (error) {}
  return "";
}

export async function runSparqlQuery(
  repository: RepositoryId,
  query: string,
  username: string
): Promise<QueryResults> {
  try {
    const endpoint = `${BACKEND_API}/sparql`;
    const response = await axios.get(
      `${endpoint}?repository=${repository}&query=${encodeURIComponent(
        query
      )}&username=${encodeURIComponent(username)}`
    );
    const results = response.data;
    return results;
  } catch (error) {
    console.log(error);
  }
  return { header: [], data: [] };
}
