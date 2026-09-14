import { makeAutoObservable, runInAction } from "mobx";
import { currentUser, login, logout, register } from "../api/auth";
import { User } from "../types";
import RootStore from "./root-store";

class AuthStore {
  rootStore: RootStore;
  user: User | null = null;
  initialized = false;

  constructor(rootStore: RootStore) {
    this.rootStore = rootStore;
    makeAutoObservable(this);
    window.addEventListener("spade:unauthorized", this.handleUnauthorized);
  }

  initialize = async () => {
    try {
      const user = await currentUser();
      runInAction(() => {
        this.user = user;
      });
    } catch {
      this.clearAccountState();
    } finally {
      runInAction(() => {
        this.initialized = true;
      });
    }
  };

  signIn = async (email: string, password: string) => {
    const user = await login(email, password);
    runInAction(() => {
      this.user = user;
    });
  };

  signUp = async (email: string, password: string) => {
    const user = await register(email, password);
    runInAction(() => {
      this.user = user;
    });
  };

  signOut = async () => {
    try {
      await logout();
    } catch {
      // Local account data must still be cleared if the session already expired.
    } finally {
      this.clearAccountState();
    }
  };

  handleUnauthorized = () => {
    this.clearAccountState();
  };

  clearAccountState = () => {
    this.user = null;
    this.rootStore.repositoryStore.reset();
    this.rootStore.queriesStore.reset();
  };
}

export default AuthStore;
