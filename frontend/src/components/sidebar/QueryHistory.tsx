import { observer } from "mobx-react-lite";
import { useEffect, useState } from "react";
import {
  Alert,
  Button,
  Modal,
  Popconfirm,
  Popover,
  Space,
  Timeline,
  Tooltip,
  Typography,
  App as AntdApp,
} from "antd";
import { useStore } from "../../stores/store";
import { MdBookmark, MdDelete } from "react-icons/md";

type QueryHistoryProps = {
  compact?: boolean;
};

const QueryHistory = observer(({ compact = false }: QueryHistoryProps) => {
  const rootStore = useStore();
  const queriesStore = rootStore.queriesStore;
  const repositoryStore = rootStore.repositoryStore;
  const [open, setOpen] = useState(false);

  useEffect(() => {
    void repositoryStore.updateQueryHistory();
  }, [repositoryStore]);

  const content = (
    <Space className="query-history-panel" direction="vertical">
      <Space className="query-history-toolbar">
        <Typography.Text type="secondary">
          {repositoryStore.getCurrentRepository()
            ? `Saved for ${repositoryStore.getCurrentRepository()}`
            : "No repository selected"}
        </Typography.Text>
        <DeleteHistory />
      </Space>
      {repositoryStore.getCurrentRepository() === null && (
        <Alert message="Choose a repository in the sidebar to view its saved queries." />
      )}
      {repositoryStore.getCurrentRepository() &&
      repositoryStore.getQueryHistory().length === 0 ? (
        <Alert message="There are no saved queries for this repository." />
      ) : (
        <div className="query-history-scroll">
          <Timeline
            style={{ padding: 5, paddingTop: 10, maxWidth: "100%" }}
            items={repositoryStore
              .getQueryHistory()
              .map(({ id, sparql, date, name }) => {
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
                          });
                          queriesStore.setCurrentQueryId(qid);
                          setOpen(false);
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

  const button = (
    <Button
      aria-label={compact ? "Saved queries" : undefined}
      shape={compact ? "circle" : undefined}
      onClick={() => setOpen(true)}
      style={compact ? undefined : { width: "100%" }}
    >
      {compact ? (
        <MdBookmark size={20} />
      ) : (
        <Space>
          <MdBookmark size={20} />
          Saved queries
        </Space>
      )}
    </Button>
  );

  return (
    <>
      <div style={compact ? undefined : { margin: 5 }}>
        {compact ? (
          <Tooltip title="Saved queries" placement="right">
            {button}
          </Tooltip>
        ) : (
          button
        )}
      </div>
      <Modal
        title="Saved queries"
        open={open}
        footer={null}
        onCancel={() => setOpen(false)}
        width={640}
      >
        {content}
      </Modal>
    </>
  );
});

const DeleteHistory = observer(() => {
  const rootStore = useStore();
  const repositoryStore = rootStore.repositoryStore;
  const { message } = AntdApp.useApp();

  const deleteHistory = async () => {
    try {
      await repositoryStore.clearQueryHistory();
      message.success("Saved queries deleted.");
    } catch {
      message.error("Could not delete the saved queries.");
    }
  };

  return (
    <Popconfirm
      title="Delete all saved queries?"
      description="This cannot be undone."
      okText="Delete all"
      cancelText="No"
      onConfirm={() => void deleteHistory()}
      style={{ justifyContent: "center" }}
      placement="top"
      disabled={repositoryStore.queryHistory().length === 0}
    >
      <Button
        aria-label="Delete all saved queries"
        danger
        disabled={repositoryStore.queryHistory().length === 0}
        name="Delete all saved queries"
      >
        <MdDelete size={20} />
      </Button>
    </Popconfirm>
  );
});

export default QueryHistory;
