import { QueryResults, RepositoryId, RepositoryInfo } from "../types";
import { api } from "./client";

export async function allRepositories(
  username: string
): Promise<RepositoryInfo[]> {
  const response = await api.get<RepositoryInfo[]>("/repositories", {
    params: { username },
  });
  return response.data;
}

export async function addRemoteRepository(
  name: string,
  sparqlEndpoint: string,
  description: string,
  username: string
): Promise<string> {
  const response = await api.post<string>("/repositories/remote", {
    name,
    endpoint: sparqlEndpoint,
    description,
    username,
  });
  return response.data;
}

export async function addLocalRepository(
  name: string,
  dataUrl: string,
  schemaUrl: string,
  description: string,
  username: string
): Promise<string> {
  const response = await api.post<string>("/repositories/local", {
    name,
    dataUrl,
    schemaUrl,
    description,
    username,
  });
  return response.data;
}

export async function deleteRepository(
  repository: string,
  username: string
): Promise<string> {
  const response = await api.delete<string>("/repositories", {
    params: { repository, username },
  });
  return response.data;
}

export async function runSparqlQuery(
  repository: RepositoryId,
  query: string,
  username: string
): Promise<QueryResults> {
  const response = await api.get<QueryResults>("/sparql", {
    params: { repository, query, username },
  });
  return response.data;
}
