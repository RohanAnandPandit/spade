import AuthStore from "./auth-store";
import QueriesStore from "./queries-store";
import RepositoryStore from "./repository-store";
import SettingsStore from "./settings-store";

class RootStore {
  settingsStore: SettingsStore;
  queriesStore: QueriesStore;
  repositoryStore: RepositoryStore;
  authStore: AuthStore;

  constructor() {
    this.settingsStore = new SettingsStore(this);
    this.queriesStore = new QueriesStore(this);
    this.repositoryStore = new RepositoryStore(this);
    this.authStore = new AuthStore(this);
  }
}

export default RootStore;
