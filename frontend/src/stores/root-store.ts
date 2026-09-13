import QueriesStore from "./queries-store";
import RepositoryStore from "./repository-store";
import SettingsStore from "./settings-store";

class RootStore {
  settingsStore: SettingsStore;
  queriesStore: QueriesStore;
  repositoryStore: RepositoryStore;

  constructor() {
    this.settingsStore = new SettingsStore(this);
    this.queriesStore = new QueriesStore(this);
    this.repositoryStore = new RepositoryStore(this);
  }
}

export default RootStore;
