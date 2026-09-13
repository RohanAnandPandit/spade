import { makeAutoObservable, runInAction } from "mobx";
import { makePersistable } from "mobx-persist-store";
import { QueryRecord, RepositoryInfo } from "../types";
import RootStore from "./root-store";
import { clearQueryHistory, getQueryHistory } from "../api/queries";
import {
  allRepositories,
  deleteRepository,
  updateRepository,
} from "../api/sparql";
import { message } from "antd";

type RepositoryStoreState = {
  currentRepository: string | null;
  queryHistory: QueryRecord[];
  repositories: RepositoryInfo[];
};

class RepositoryStore {
  state: RepositoryStoreState = {
    currentRepository: null,
    queryHistory: [],
    repositories: [],
  };

  constructor(_rootStore: RootStore) {
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
      storage: window.sessionStorage,
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

  setCurrentRepository = (repositoryId: string | null) => {
    if (this.state.currentRepository === repositoryId) return;
    this.state.currentRepository = repositoryId;
    this.state.queryHistory = [];
    if (repositoryId) void this.updateQueryHistory();
  };

  updateQueryHistory = async () => {
    if (this.state.currentRepository) {
      try {
        const queries = await getQueryHistory(this.state.currentRepository);
        runInAction(() => {
          this.state.queryHistory = queries;
        });
      } catch {
        runInAction(() => {
          this.state.queryHistory = [];
        });
        message.error("Could not load saved queries.");
      }
    }
  };

  clearQueryHistory = async () => {
    if (this.state.currentRepository) {
      await clearQueryHistory(this.state.currentRepository);
      await this.updateQueryHistory();
    }
  };

  updateRepositories = async () => {
    try {
      const repositories = await allRepositories();
      runInAction(() => {
        this.state.repositories = repositories;
      });
    } catch {
      runInAction(() => {
        this.state.repositories = [];
      });
      message.error("Could not load repositories.");
    }
  };

  deleteRepository = async (repository: string) => {
    await deleteRepository(repository);
    runInAction(() => {
      if (this.state.currentRepository === repository) {
        this.state.currentRepository = null;
        this.state.queryHistory = [];
      }
    });
    await this.updateRepositories();
  };

  updateRepository = async (repository: string, updates: RepositoryInfo) => {
    const updated = await updateRepository(repository, updates);
    runInAction(() => {
      if (this.state.currentRepository === repository) {
        this.state.currentRepository = updated.name;
      }
    });
    await this.updateRepositories();
    return updated;
  };

  reset = () => {
    this.state = {
      currentRepository: null,
      queryHistory: [],
      repositories: [],
    };
    window.sessionStorage.removeItem("Repository");
    window.localStorage.removeItem("Repository");
  };
}

export default RepositoryStore;
