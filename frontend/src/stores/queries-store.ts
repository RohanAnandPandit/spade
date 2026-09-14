import { makeAutoObservable } from "mobx";
import { makePersistable } from "mobx-persist-store";
import RootStore from "./root-store";
import { QueryId, QueryInfo } from "../types";

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

  getCurrentQuery = (id: string) => {
    if (!Object.keys(this.state.openQueries).includes(id)) {
      return "";
    }
    return this.state.openQueries[id]!;
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
  }: {
    sparql?: string;
    name?: string;
  } = {}): QueryId => {
    const qid = `${++this.state.totalQueries}`;
    this.state.openQueries[qid] = {
      name: name || `Query ${qid}`,
      sparql,
    };
    return qid;
  };

  removeQuery = (qid: string) => {
    delete this.state.openQueries[qid];
    const remainingIds = Object.keys(this.state.openQueries);
    if (remainingIds.length === 0) {
      const replacementId = this.addQuery({});
      this.setCurrentQueryId(replacementId);
      return;
    }
    if (this.state.currentQueryId === qid) {
      this.setCurrentQueryId(remainingIds.at(-1)!);
    }
  };

  reset = () => {
    this.state = {
      totalQueries: 1,
      openQueries: {
        "1": { name: "Query 1", sparql: "" },
      },
      currentQueryId: "1",
    };
    window.localStorage.removeItem("Queries");
  };
}

export default QueriesStore;
