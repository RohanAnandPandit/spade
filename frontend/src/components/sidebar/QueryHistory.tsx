import { observer } from "mobx-react-lite";
import { useEffect } from "react";
import {
  Alert,
  Button,
  Popconfirm,
  Popover,
  Space,
  Timeline,
  Tooltip,
  Typography,
  App as AntdApp,
} from "antd";
import { useStore } from "../../stores/store";
import { MdDelete, MdHistory } from "react-icons/md";

const { Title } = Typography;

type QueryHistoryProps = {
  compact?: boolean;
};

const QueryHistory = observer(({ compact = false }: QueryHistoryProps) => {
  const rootStore = useStore();
  const settings = rootStore.settingsStore;
  const queriesStore = rootStore.queriesStore;
  const repositoryStore = rootStore.repositoryStore;

  useEffect(() => {
    void repositoryStore.updateQueryHistory();
  }, [repositoryStore]);

  const content = (
    <Space
      direction="vertical"
      style={{
        width: compact ? 320 : "100%",
        maxWidth: compact ? "calc(100vw - 110px)" : undefined,
        justifyContent: "center",
      }}
    >
      <Space
        style={{
          padding: 5,
          margin: "auto",
          width: "100%",
          justifyContent: "center",
        }}
      >
        <Title level={4}>Query History</Title>
        <DeleteHistory />
      </Space>
      {repositoryStore.getCurrentRepository() === null && (
        <div style={{ padding: 5 }}>
          <Alert message="Select a repository to see the queries you have run in the past" />
        </div>
      )}
      {repositoryStore.getCurrentRepository() &&
      repositoryStore.getQueryHistory().length === 0 ? (
        <div style={{ padding: 5 }}>
          <Alert message="There are no saved queries for this repository" />
        </div>
      ) : (
        <div
          style={{
            width: "100%",
            height: compact
              ? Math.min(360, Math.max(180, settings.screenHeight() - 250))
              : settings.screenHeight() - 450,
            overflowY: "auto",
          }}
        >
          <Timeline
            style={{ padding: 5, paddingTop: 10, maxWidth: "100%" }}
            items={repositoryStore
              .getQueryHistory()
              .map(({ id, sparql, date, name, repository }) => {
                return {
                  children: (
                    <Popover
                      key={`query-${id}`}
                      placement="right"
                      title={`Saved on ${date}`}
                      content={
                        <div
                          style={{
                            whiteSpace: "pre-wrap",
                            fontFamily: "consolas",
                          }}
                        >
                          {sparql}
                        </div>
                      }
                      trigger="hover"
                      style={{ width: "100%" }}
                    >
                      <Button
                        name="Click to open tab"
                        onClick={() => {
                          const qid = queriesStore.addQuery({
                            sparql,
                            name,
                            repository,
                          });
                          queriesStore.setCurrentQueryId(qid);
                        }}
                        style={{
                          height: "auto",
                          width: "100%",
                          whiteSpace: "normal",
                        }}
                      >
                        {name}
                      </Button>
                    </Popover>
                  ),
                };
              })}
          />
        </div>
      )}
    </Space>
  );

  if (compact) {
    return (
      <Popover content={content} placement="rightTop" trigger="click">
        <Tooltip title="Query history" placement="right">
          <Button aria-label="Query history" shape="circle">
            <MdHistory size={20} />
          </Button>
        </Tooltip>
      </Popover>
    );
  }

  return content;
});

const DeleteHistory = observer(() => {
  const rootStore = useStore();
  const repositoryStore = rootStore.repositoryStore;
  const { message } = AntdApp.useApp();

  const deleteHistory = async () => {
    try {
      await repositoryStore.clearQueryHistory();
      message.success("Query history cleared.");
    } catch {
      message.error("Could not clear query history.");
    }
  };

  return (
    <Popconfirm
      title={"Clear entire history"}
      description={`Are you sure?`}
      okText="Yes"
      cancelText="No"
      onConfirm={() => void deleteHistory()}
      style={{ justifyContent: "center" }}
      placement="top"
      disabled={repositoryStore.queryHistory().length === 0}
    >
      <Button
        danger
        disabled={repositoryStore.queryHistory().length === 0}
        name="Clear history"
      >
        <MdDelete size={20} />
      </Button>
    </Popconfirm>
  );
});

export default QueryHistory;
