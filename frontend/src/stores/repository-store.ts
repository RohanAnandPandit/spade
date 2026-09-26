import { makeAutoObservable, runInAction } from "mobx";
import { makePersistable } from "mobx-persist-store";
import { RepositoryInfo } from "../types";
import RootStore from "./root-store";
import {
  allRepositories,
  deleteRepository,
  updateRepository,
} from "../api/sparql";
import { message } from "antd";

type RepositoryStoreState = {
  currentRepository: string | null;
  repositories: RepositoryInfo[];
};

class RepositoryStore {
  state: RepositoryStoreState = {
    currentRepository: null,
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
          deserialize: (value) => {
            const stored = JSON.parse(value) as RepositoryStoreState;
            return {
              currentRepository: stored.currentRepository ?? null,
              repositories: stored.repositories ?? [],
            };
          },
        },
      ],
      storage: window.sessionStorage,
    });
  }

  currentRepository = () => this.state.currentRepository;

  repositories = () => {
    return this.state.repositories;
  };

  getCurrentRepository = () => {
    return this.state.currentRepository;
  };

  setCurrentRepository = (repositoryId: string | null) => {
    if (this.state.currentRepository === repositoryId) return;
    this.state.currentRepository = repositoryId;
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
      repositories: [],
    };
    window.sessionStorage.removeItem("Repository");
    window.localStorage.removeItem("Repository");
  };
}

export default RepositoryStore;
