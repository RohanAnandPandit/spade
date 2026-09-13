import { QueryResults, RepositoryId, RepositoryInfo } from "../types";
import { api } from "./client";

export async function allRepositories(): Promise<RepositoryInfo[]> {
  const response = await api.get<RepositoryInfo[]>("/repositories");
  return response.data;
}

export async function addRemoteRepository(
  name: string,
  sparqlEndpoint: string,
  description: string
): Promise<string> {
  const response = await api.post<{ name: string }>("/repositories/remote", {
    name,
    endpoint: sparqlEndpoint,
    description,
  });
  return response.data.name;
}

export async function addLocalRepository(
  name: string,
  dataFile: File,
  schemaFile: File | undefined,
  description: string
): Promise<string> {
  const body = new FormData();
  body.append("name", name);
  body.append("description", description);
  body.append("dataFile", dataFile);
  if (schemaFile) body.append("schemaFile", schemaFile);
  const response = await api.post<{ name: string }>(
    "/repositories/local",
    body
  );
  return response.data.name;
}

export async function deleteRepository(repository: string): Promise<string> {
  const response = await api.delete<{ name: string }>(
    `/repositories/${encodeURIComponent(repository)}`
  );
  return response.data.name;
}

export async function runSparqlQuery(
  repository: RepositoryId,
  query: string
): Promise<QueryResults> {
  const response = await api.get<QueryResults>("/sparql", {
    params: { repository, query },
  });
  return response.data;
}
