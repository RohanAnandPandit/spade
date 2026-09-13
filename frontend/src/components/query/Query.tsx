import { useEffect, useState } from "react";
import {
  Button,
  Space,
  Tabs,
  TabsProps,
  Tooltip,
  App as AntdApp,
  Dropdown,
} from "antd";
import { observer } from "mobx-react-lite";
import { BiNetworkChart } from "react-icons/bi";
import { BsBarChartSteps, BsTable } from "react-icons/bs";
import { useStore } from "../../stores/store";
import {
  ChartType,
  QueryResults,
  RepositoryId,
  RepositoryInfo,
  Triplet,
} from "../../types";
import { isEmpty } from "../../utils/queryResults";
import Graph from "./Graph";
import Editor from "./Editor";
import Results from "./Results";
import Charts from "./Charts";
import { MdOutlineEditNote } from "react-icons/md";
import { runSparqlQuery } from "../../api/sparql";
import { FiPlay } from "react-icons/fi";
import { RiGitRepositoryLine } from "react-icons/ri";
import { apiErrorMessage } from "../../api/client";
import { useQueryAnalysis } from "../../hooks/useQueryAnalysis";

type QueryProps = {
  qid: string;
};

const Query = observer(({ qid }: QueryProps) => {
  const rootStore = useStore();
  const settings = rootStore.settingsStore;
  const repositoryStore = rootStore.repositoryStore;
  const queriesStore = rootStore.queriesStore;
  const authStore = rootStore.authStore;
  const username = authStore.username!;
  const [results, setResults] = useState<QueryResults>({
    header: [],
    data: [],
  });
  const {
    name,
    sparql: query,
    repository = repositoryStore.currentRepository(),
  } = queriesStore.getQuery(qid);

  const setQueryText = (text: string) => {
    queriesStore.setQueryText(qid, text);
  };

  const setRepository = (repositoryId: RepositoryId | null) => {
    queriesStore.setQueryRepository(qid, repositoryId);
  };

  const [graphKey, setGraphKey] = useState<number>(0);
  const [queryLoading, setQueryLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("editor");

  const width = Math.floor(
    window.innerWidth -
      (settings.fullScreen() ? 0 : settings.sidebarWidth() + 200)
  );
  const height = Math.floor(
    window.innerHeight - (settings.fullScreen() ? 250 : 50)
  );

  const { message, notification } = AntdApp.useApp();

  const showNotification = (time: number) => {
    notification.info({
      message: "Query finished!",
      description: `Got results in ${time} ms`,
      placement: "top",
      duration: 3,
    });
  };

  const {
    analysis: queryAnalysis,
    loading: analysisLoading,
    error: analysisError,
  } = useQueryAnalysis(query, repository, username);

  useEffect(() => {
    if (analysisError) message.error(analysisError);
  }, [analysisError, message]);

  const executeQuery = async () => {
    if (!repository) return;
    setQueryLoading(true);
    const start = performance.now();
    try {
      const nextResults = await runSparqlQuery(repository, query, username);
      setResults(nextResults);
      setGraphKey((key) => key + 1);
      await repositoryStore.updateQueryHistory();
      setActiveTab("results");
      showNotification(Math.round(performance.now() - start));
    } catch (error) {
      message.error(apiErrorMessage(error, "Could not run the query."));
    } finally {
      setQueryLoading(false);
    }
  };

  const items: TabsProps["items"] = [
    {
      key: "editor",
      label: (
        <Space.Compact>
          <MdOutlineEditNote size={25} />
          Query
        </Space.Compact>
      ),
      children: (
        <Editor
          query={query}
          queryName={name}
          onChange={setQueryText}
          width={width}
          height={height}
          repository={repository}
          queryAnalysis={queryAnalysis}
          analysisLoading={analysisLoading}
        />
      ),
    },
    {
      key: "results",
      label: (
        <Space.Compact>
          <BsTable size={15} style={{ margin: 5 }} />
          Results
        </Space.Compact>
      ),
      children: <Results results={results} loading={queryLoading} />,
    },
    {
      key: "graph",
      label: (
        <Space.Compact title="Use CONSTRUCT for a graph">
          <BiNetworkChart size={20} style={{ margin: 5 }} />
          Graph
        </Space.Compact>
      ),
      disabled:
        isEmpty(results) ||
        !queryAnalysis?.visualisations.includes(ChartType.GRAPH),
      children: (
        <Graph
          key={graphKey}
          links={results.data as Triplet[]}
          repository={repositoryStore.currentRepository()!}
        />
      ),
    },
    {
      key: "charts",
      label: (
        <Tooltip title="View recommended charts">
          <Space.Compact>
            <BsBarChartSteps size={15} style={{ margin: 5 }} />
            Charts
          </Space.Compact>
        </Tooltip>
      ),
      disabled:
        isEmpty(results) ||
        queryAnalysis?.visualisations.includes(ChartType.GRAPH),
      children: (
        <Charts
          results={results}
          showAllCharts={settings.state.showAllCharts}
          queryAnalysis={queryAnalysis}
        />
      ),
    },
  ];

  return (
    <Tabs
      activeKey={activeTab}
      items={items}
      onChange={(activeKey) => setActiveTab(activeKey)}
      tabBarExtraContent={{
        left: (
          <Button
            style={{ marginRight: 20 }}
            icon={<FiPlay size={20} />}
            title={repository ? "Run query" : "Select repository to run query"}
            disabled={repository === null}
            loading={queryLoading}
            onClick={() => void executeQuery()}
          >
            Run
          </Button>
        ),
        right: (
          <SelectRepository
            repository={repository}
            setRepository={setRepository}
          />
        ),
      }}
    />
  );
});

const SelectRepository = observer(
  ({
    repository,
    setRepository,
  }: {
    repository: string | null;
    setRepository: (repositoryId: string | null) => void;
  }) => {
    const rootStore = useStore();
    const repositoryStore = rootStore.repositoryStore;

    return (
      <Dropdown
        menu={{
          items: repositoryStore
            .repositories()
            .map(({ name }: RepositoryInfo, index) => {
              return {
                key: `${index}`,
                label: (
                  <Button
                    onClick={() => setRepository(name)}
                    style={{ width: "100%", height: "100%" }}
                  >
                    {name}
                  </Button>
                ),
              };
            }),
        }}
      >
        <Button name="Choose repository">
          <Space>
            <RiGitRepositoryLine size={20} />
            {repository || "Choose repository"}
          </Space>
        </Button>
      </Dropdown>
    );
  }
);

export default Query;
