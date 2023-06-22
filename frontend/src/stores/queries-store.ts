import { makeAutoObservable } from "mobx";
import { makePersistable } from "mobx-persist-store";
import RootStore from "./root-store";
import { QueryId, QueryInfo, RepositoryId } from "../types";

type QueriesState = {
  totalQueries: number;
  openQueries: { [key: string]: QueryInfo };
  currentQueryId: string;
};

class QueriesStore {
  rootStore: RootStore;
  state: QueriesState = {
    totalQueries: 1,
    openQueries: {
      "1": {
        name: "Query 1",
        sparql: "",
        repository: null,
      },
    },
    currentQueryId: "1",
  };

  constructor(rootStore: RootStore) {
    this.rootStore = rootStore;
    makeAutoObservable(this);
    makePersistable(this, {
      name: "Queries",
      properties: [
        {
          key: "state",
          serialize: (value) => JSON.stringify(value),
          deserialize: (value) => JSON.parse(value),
        },
      ],
      storage: window.localStorage,
    });
  }

  openQueries = () => {
    return this.state.openQueries;
  };

  currentQueryId = (): string => {
    return this.state.currentQueryId;
  };

  getQuery = (qid: string): QueryInfo => {
    return this.openQueries()[qid];
  };

  currentQuery = (): QueryInfo => {
    return this.openQueries()[this.currentQueryId()];
  };

  setCurrentQueryId = (key: string): void => {
    this.state.currentQueryId = key;
  };

  setQueryText = (id: string, sparql: string) => {
    this.state.openQueries[id]!.sparql = sparql;
  };

  setQueryRepository = (id, repositoryId: RepositoryId | null) => {
    this.state.openQueries[id]!.repository = repositoryId;
  };

  getCurrentQuery = (id: string) => {
    if (!Object.keys(this.state.openQueries).includes(id)) {
      return "";
    }
    return this.state.openQueries[this.currentQueryId()]!;
  };

  setCurrentQuery = (sparql: string) => {
    this.state.openQueries[this.currentQueryId()]!.sparql = sparql;
  };

  getQueryName = (id: string) => {
    if (!Object.keys(this.state.openQueries).includes(id)) {
      return "";
    }
    return this.state.openQueries[id]!.name;
  };

  setQueryTitle = (id: string, title: string) => {
    this.state.openQueries[id]!.name = title;
  };

  addQuery = ({
    sparql = "",
    name = "",
    repository = null,
  }: {
    sparql?: string;
    name?: string;
    repository?: RepositoryId | null;
  }): QueryId => {
    const qid = `${++this.state.totalQueries}`;
    this.state.openQueries[qid] = {
      name: name || `Query ${qid}`,
      sparql,
      repository,
    };
    return qid;
  };

  removeQuery = (qid: string) => {
    delete this.state.openQueries[qid];
  };
}

export default QueriesStore;
