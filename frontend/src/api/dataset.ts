import axios from "axios";
import { Metadata, PropertyType, RDFGraph, RepositoryId, URI } from "../types";
import { emptyGraph } from "../utils/queryResults";

const BACKEND_API = import.meta.env.VITE_API_URL ?? "http://localhost:5000";

export async function getClasses(
  repository: RepositoryId,
  username: string
): Promise<URI[]> {
  try {
    const endpoint = `${BACKEND_API}/dataset/classes?repository=${repository}&username=${encodeURIComponent(
      username
    )}`;
    const response = await axios.get(endpoint);
    const classes = response.data;
    return classes;
  } catch (error) {}
  return [];
}

export async function getClassHierarchy(
  repository: RepositoryId,
  username: string
): Promise<RDFGraph> {
  try {
    const endpoint = `${BACKEND_API}/dataset/class-hierarchy?repository=${repository}&username=${encodeURIComponent(
      username
    )}`;
    const response = await axios.get(endpoint);
    const graph = response.data;
    return graph;
  } catch (error) {}
  return emptyGraph();
}

export async function getNoOfTriplets(
  repository: RepositoryId,
  username: string
): Promise<number> {
  try {
    const endpoint = `${BACKEND_API}/dataset/triplet-count?repository=${repository}&username=${encodeURIComponent(
      username
    )}`;
    const response = await axios.get(endpoint);
    const totalTriplets = parseInt(response.data);
    return totalTriplets;
  } catch (error) {}
  return 0;
}

export async function getAllTypes(
  repository: RepositoryId,
  username: string
): Promise<URI[]> {
  try {
    const endpoint = `${BACKEND_API}/dataset/all-types?repository=${repository}&username=${encodeURIComponent(
      username
    )}`;
    const response = await axios.get(endpoint);
    const classes = response.data;
    return classes;
  } catch (error) {}
  return [];
}

export async function getTypeProperties(
  repository: RepositoryId,
  type: URI,
  username: string
): Promise<URI[]> {
  try {
    const endpoint = `${BACKEND_API}/dataset/type-properties?repository=${repository}&type=${encodeURIComponent(
      type
    )}&username=${encodeURIComponent(username)}`;
    const response = await axios.get(endpoint);
    const properties = response.data;
    return properties;
  } catch (error) {}
  return [];
}

export async function getMetaInformation(
  repository: RepositoryId,
  uri: URI,
  username: string
): Promise<Metadata> {
  try {
    const endpoint = `${BACKEND_API}/dataset/meta-information?repository=${repository}&uri=${encodeURIComponent(
      uri
    )}&username=${encodeURIComponent(username)}`;
    const response = await axios.get(endpoint);
    const properties = response.data;
    return properties;
  } catch (error) {}

  return { comment: "", label: "", range: "", domain: "" };
}

export async function getOutgoingLinks(
  repository: RepositoryId,
  uri: URI,
  username: string
): Promise<{ [key: URI]: number }> {
  try {
    const endpoint = `${BACKEND_API}/dataset/outgoing-links?repository=${repository}&uri=${encodeURIComponent(
      uri
    )}&username=${encodeURIComponent(username)}`;
    const response = await axios.get(endpoint);
    const properties = response.data;
    return properties;
  } catch (error) {}

  return {};
}

export async function getIncomingLinks(
  repository: RepositoryId,
  uri: URI,
  username: string
): Promise<{ [key: URI]: number }> {
  try {
    const endpoint = `${BACKEND_API}/dataset/incoming-links?repository=${repository}&uri=${encodeURIComponent(
      uri
    )}&username=${encodeURIComponent(username)}`;
    const response = await axios.get(endpoint);
    const properties = response.data;
    return properties;
  } catch (error) {}

  return {};
}

export async function getAllProperties(
  repository: RepositoryId,
  username: string
): Promise<URI[]> {
  try {
    const endpoint = `${BACKEND_API}/dataset/all-properties?repository=${repository}&username=${encodeURIComponent(
      username
    )}`;
    const response = await axios.get(endpoint);
    const properties = response.data;
    return properties;
  } catch (error) {}
  return [];
}

export async function getPropertyValues(
  repository: RepositoryId,
  uri: URI,
  propType: PropertyType,
  username: string
): Promise<[URI, string][]> {
  try {
    const endpoint = `${BACKEND_API}/dataset/property-values?repository=${repository}&uri=${encodeURIComponent(
      uri
    )}&propType=${PropertyType[propType]}&username=${encodeURIComponent(
      username
    )}`;
    const response = await axios.get(endpoint);
    const data = response.data;
    return data;
  } catch (error) {}
  return [];
}

export async function getInstances(
  repository: RepositoryId,
  type: URI,
  username: string
): Promise<URI[]> {
  try {
    const endpoint = `${BACKEND_API}/dataset/type-instances?repository=${repository}&type=${encodeURIComponent(
      type
    )}&username=${encodeURIComponent(username)}`;
    const response = await axios.get(endpoint);
    const data = response.data;
    return data;
  } catch (error) {}

  return [];
}

export async function getType(
  repository: RepositoryId,
  uri: URI,
  username: string
): Promise<URI[]> {
  try {
    const endpoint = `${BACKEND_API}/dataset/type?repository=${repository}&uri=${encodeURIComponent(
      uri
    )}&username=${encodeURIComponent(username)}`;
    const response = await axios.get(endpoint);
    const type = response.data;
    return type;
  } catch (error) {}

  return [];
}
