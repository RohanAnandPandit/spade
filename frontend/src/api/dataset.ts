import { Metadata, PropertyType, RDFGraph, RepositoryId, URI } from "../types";
import { api } from "./client";

const get = async <T>(path: string, params: Record<string, unknown>) =>
  (
    await api.get<T>(path, {
      params,
    })
  ).data;

export const getClasses = (repository: RepositoryId) =>
  get<URI[]>("/dataset/classes", { repository });

export const getClassHierarchy = (repository: RepositoryId) =>
  get<RDFGraph>("/dataset/class-hierarchy", { repository });

export const getNoOfTriplets = async (repository: RepositoryId) =>
  Number(await get<string>("/dataset/triplet-count", { repository }));

export const getAllTypes = (repository: RepositoryId) =>
  get<URI[]>("/dataset/all-types", { repository });

export const getTypeProperties = (repository: RepositoryId, type: URI) =>
  get<URI[]>("/dataset/type-properties", { repository, type });

export const getMetaInformation = (repository: RepositoryId, uri: URI) =>
  get<Metadata>("/dataset/meta-information", { repository, uri });

export const getOutgoingLinks = (repository: RepositoryId, uri: URI) =>
  get<Record<URI, number>>("/dataset/outgoing-links", {
    repository,
    uri,
  });

export const getIncomingLinks = (repository: RepositoryId, uri: URI) =>
  get<Record<URI, number>>("/dataset/incoming-links", {
    repository,
    uri,
  });

export const getAllProperties = (repository: RepositoryId) =>
  get<URI[]>("/dataset/all-properties", { repository });

export const getPropertyValues = (
  repository: RepositoryId,
  uri: URI,
  propType: PropertyType
) =>
  get<[URI, string][]>("/dataset/property-values", {
    repository,
    uri,
    propType: PropertyType[propType],
  });

export const getInstances = (repository: RepositoryId, type: URI) =>
  get<URI[]>("/dataset/type-instances", { repository, type });

export const getType = (repository: RepositoryId, uri: URI) =>
  get<URI[]>("/dataset/type", { repository, uri });
