import { QueryResults, RepositoryId, RepositoryInfo } from "../types";
import { api } from "./client";
import { getWorkspaceId } from "./workspace";

export async function allRepositories(): Promise<RepositoryInfo[]> {
  const response = await api.get<RepositoryInfo[]>("/repositories", {
    params: { workspace: getWorkspaceId() },
  });
  return response.data;
}

export async function addRemoteRepository(
  name: string,
  sparqlEndpoint: string,
  description: string
): Promise<string> {
  const response = await api.post<string>("/repositories/remote", {
    name,
    endpoint: sparqlEndpoint,
    description,
    workspace: getWorkspaceId(),
  });
  return response.data;
}

export async function addLocalRepository(
  name: string,
  dataUrl: string,
  schemaUrl: string,
  description: string
): Promise<string> {
  const response = await api.post<string>("/repositories/local", {
    name,
    dataUrl,
    schemaUrl,
    description,
    workspace: getWorkspaceId(),
  });
  return response.data;
}

export async function deleteRepository(repository: string): Promise<string> {
  const response = await api.delete<string>("/repositories", {
    params: { repository, workspace: getWorkspaceId() },
  });
  return response.data;
}

export async function runSparqlQuery(
  repository: RepositoryId,
  query: string
): Promise<QueryResults> {
  const response = await api.get<QueryResults>("/sparql", {
    params: { repository, query, workspace: getWorkspaceId() },
  });
  return response.data;
}
