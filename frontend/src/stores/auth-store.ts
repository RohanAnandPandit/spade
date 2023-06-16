import { makeAutoObservable } from "mobx";
import RootStore from "./root-store";
import { makePersistable } from "mobx-persist-store";

type AuthStoreState = {
  username: string | null;
};

class AuthStore {
  rootStore: RootStore;
  state: AuthStoreState = {
    username: null,
  };

  constructor(rootStore: RootStore) {
    this.rootStore = rootStore;
    makeAutoObservable(this);
    makePersistable(this, {
      name: "Auth",
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

  logout() {
    this.setUsername(null);
  }

  setUsername(username: string | null) {
    this.state.username = username;
  }

  get username(): string | null {
    return this.state.username;
  }
}

export default AuthStore;
