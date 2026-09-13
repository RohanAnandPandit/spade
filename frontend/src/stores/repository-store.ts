import { makeAutoObservable, runInAction } from "mobx";
import { makePersistable } from "mobx-persist-store";
import { QueryRecord, RepositoryInfo } from "../types";
import RootStore from "./root-store";
import { clearQueryHistory, getQueryHistory } from "../api/queries";
import { allRepositories, deleteRepository } from "../api/sparql";
import { message } from "antd";

type RepositoryStoreState = {
  currentRepository: string | null;
  queryHistory: QueryRecord[];
  repositories: RepositoryInfo[];
};

class RepositoryStore {
  rootStore: RootStore;
  state: RepositoryStoreState = {
    currentRepository: null,
    queryHistory: [],
    repositories: [],
  };

  constructor(rootStore: RootStore) {
    this.rootStore = rootStore;
    makeAutoObservable(this);
    makePersistable(this, {
      name: "Repository",
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

  currentRepository = () => this.state.currentRepository;

  queryHistory = () => {
    return this.state.queryHistory;
  };

  repositories = () => {
    return this.state.repositories;
  };

  getCurrentRepository = () => {
    return this.state.currentRepository;
  };

  getQueryHistory = () => {
    return this.state.queryHistory;
  };

  setCurrentRepository = (repositoryId: string) => {
    this.state.currentRepository = repositoryId;
    this.state.queryHistory = [];
    void this.updateQueryHistory();
  };

  updateQueryHistory = async () => {
    if (this.state.currentRepository) {
      const username = this.rootStore.authStore.username!;
      try {
        const queries = await getQueryHistory(
          this.state.currentRepository,
          username
        );
        runInAction(() => {
          this.state.queryHistory = queries;
        });
      } catch {
        runInAction(() => {
          this.state.queryHistory = [];
        });
        message.error("Could not load query history.");
      }
    }
  };

  clearQueryHistory = async () => {
    if (this.state.currentRepository) {
      const username = this.rootStore.authStore.username!;
      await clearQueryHistory(this.state.currentRepository, username);
      await this.updateQueryHistory();
    }
  };

  updateRepositories = async () => {
    const username = this.rootStore.authStore.username;
    if (username) {
      try {
        const repositories = await allRepositories(username);
        runInAction(() => {
          this.state.repositories = repositories;
        });
      } catch {
        runInAction(() => {
          this.state.repositories = [];
        });
        message.error("Could not load repositories.");
      }
    }
  };

  deleteRepository = async (repository: string) => {
    const username = this.rootStore.authStore.username;
    if (username) {
      await deleteRepository(repository, username);
      runInAction(() => {
        if (this.state.currentRepository === repository) {
          this.state.currentRepository = null;
          this.state.queryHistory = [];
        }
        Object.entries(this.rootStore.queriesStore.openQueries()).forEach(
          ([queryId, query]) => {
            if (query.repository === repository) {
              this.rootStore.queriesStore.setQueryRepository(queryId, null);
            }
          }
        );
      });
      await this.updateRepositories();
    }
  };
}

export default RepositoryStore;
