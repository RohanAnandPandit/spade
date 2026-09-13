import { Metadata, PropertyType, RDFGraph, RepositoryId, URI } from "../types";
import { api } from "./client";

const get = async <T>(path: string, params: Record<string, unknown>) =>
  (await api.get<T>(path, { params })).data;

export const getClasses = (repository: RepositoryId, username: string) =>
  get<URI[]>("/dataset/classes", { repository, username });

export const getClassHierarchy = (repository: RepositoryId, username: string) =>
  get<RDFGraph>("/dataset/class-hierarchy", { repository, username });

export const getNoOfTriplets = async (
  repository: RepositoryId,
  username: string
) =>
  Number(await get<string>("/dataset/triplet-count", { repository, username }));

export const getAllTypes = (repository: RepositoryId, username: string) =>
  get<URI[]>("/dataset/all-types", { repository, username });

export const getTypeProperties = (
  repository: RepositoryId,
  type: URI,
  username: string
) => get<URI[]>("/dataset/type-properties", { repository, type, username });

export const getMetaInformation = (
  repository: RepositoryId,
  uri: URI,
  username: string
) => get<Metadata>("/dataset/meta-information", { repository, uri, username });

export const getOutgoingLinks = (
  repository: RepositoryId,
  uri: URI,
  username: string
) =>
  get<Record<URI, number>>("/dataset/outgoing-links", {
    repository,
    uri,
    username,
  });

export const getIncomingLinks = (
  repository: RepositoryId,
  uri: URI,
  username: string
) =>
  get<Record<URI, number>>("/dataset/incoming-links", {
    repository,
    uri,
    username,
  });

export const getAllProperties = (repository: RepositoryId, username: string) =>
  get<URI[]>("/dataset/all-properties", { repository, username });

export const getPropertyValues = (
  repository: RepositoryId,
  uri: URI,
  propType: PropertyType,
  username: string
) =>
  get<[URI, string][]>("/dataset/property-values", {
    repository,
    uri,
    propType: PropertyType[propType],
    username,
  });

export const getInstances = (
  repository: RepositoryId,
  type: URI,
  username: string
) => get<URI[]>("/dataset/type-instances", { repository, type, username });

export const getType = (repository: RepositoryId, uri: URI, username: string) =>
  get<URI[]>("/dataset/type", { repository, uri, username });
