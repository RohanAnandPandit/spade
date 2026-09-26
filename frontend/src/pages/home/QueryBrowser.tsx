import React from "react";
import type { InputRef } from "antd";
import {
  App as AntdApp,
  Button,
  Input,
  Modal,
  Popover,
  Tabs,
  Tooltip,
  Typography,
} from "antd";
import {
  EditOutlined,
  PlusOutlined,
  SaveOutlined,
  UnorderedListOutlined,
} from "@ant-design/icons";
import { BiCopy } from "react-icons/bi";
import Query from "../../components/query/Query";
import Templates from "../../components/query/Templates";
import { sparqlTemplates } from "../../utils/sparqlTemplates";
import { useStore } from "../../stores/store";
import { observer } from "mobx-react-lite";
import "./QueryBrowser.css";
import { QueryInfo } from "../../types";

const TRIAL_QUERY = `PREFIX mondial: <http://www.semwebtech.org/mondial/10/meta#>

SELECT ?country ?capital ?population
WHERE {
  ?countryResource a mondial:Country ;
    mondial:name ?country ;
    mondial:capital ?capitalResource ;
    mondial:population ?population .
  ?capitalResource mondial:name ?capital .
}
ORDER BY DESC(?population)
LIMIT 25`;

export function useQueryBrowser(demo: boolean) {
  const { queriesStore } = useStore();
  const { message } = AntdApp.useApp();
  const [demoTotal, setDemoTotal] = React.useState(1);
  const [demoCurrentQueryId, setDemoCurrentQueryId] = React.useState("1");
  const [demoQueries, setDemoQueries] = React.useState<
    Record<string, QueryInfo>
  >({
    "1": {
      name: "World countries",
      sparql: TRIAL_QUERY,
      updatedAt: new Date().toISOString(),
    },
  });
  const openQueries = demo ? demoQueries : queriesStore.openQueries();
  const currentQueryId = demo
    ? demoCurrentQueryId
    : queriesStore.currentQueryId();
  const savedSnapshots = React.useRef<Record<string, string>>({});
  const [pendingAction, setPendingAction] = React.useState<
    null | { type: "new" } | { type: "select"; id: string }
  >(null);
  const [saving, setSaving] = React.useState(false);
  const snapshot = (query: QueryInfo) =>
    JSON.stringify([query.name, query.sparql]);
  if (demo) {
    for (const [id, query] of Object.entries(openQueries)) {
      savedSnapshots.current[id] ??= snapshot(query);
    }
  }

  const select = (id: string) => {
    if (demo) setDemoCurrentQueryId(id);
    else queriesStore.setCurrentQueryId(id);
  };

  const add = () => {
    if (demo) {
      const id = `${demoTotal + 1}`;
      setDemoTotal((total) => total + 1);
      setDemoQueries((queries) => ({
        ...queries,
        [id]: {
          name: `Query ${id}`,
          sparql: "",
          updatedAt: new Date().toISOString(),
        },
      }));
      setDemoCurrentQueryId(id);
    } else {
      select(queriesStore.addQuery());
    }
  };

  const updateDemoQuery = (id: string, updates: Partial<QueryInfo>) => {
    setDemoQueries((queries) => ({
      ...queries,
      [id]: {
        ...queries[id]!,
        ...updates,
        updatedAt: new Date().toISOString(),
      },
    }));
  };

  const rename = (id: string, name: string) => {
    if (demo) updateDemoQuery(id, { name });
    else queriesStore.setQueryTitle(id, name);
  };
  const applyTemplate = (sparql: string) => {
    if (demo) updateDemoQuery(demoCurrentQueryId, { sparql });
    else queriesStore.setQueryText(queriesStore.currentQueryId(), sparql);
  };

  const currentQuery = openQueries[currentQueryId];
  const request = (
    action: { type: "new" } | { type: "select"; id: string }
  ) => {
    const activeId = demo ? demoCurrentQueryId : queriesStore.currentQueryId();
    if (action.type === "select" && action.id === activeId) return;
    const activeQuery = demo ? demoQueries[activeId] : undefined;
    const dirty = demo
      ? !!activeQuery &&
        savedSnapshots.current[activeId] !== snapshot(activeQuery)
      : queriesStore.isQueryDirty(activeId);
    if (dirty) setPendingAction(action);
    else if (action.type === "new") add();
    else select(action.id);
  };
  const continueToPending = () => {
    if (demo) {
      const baseline = savedSnapshots.current[demoCurrentQueryId];
      if (baseline) {
        const [name, sparql] = JSON.parse(baseline) as [string, string];
        updateDemoQuery(demoCurrentQueryId, { name, sparql });
      }
    } else {
      queriesStore.discardQueryChanges(queriesStore.currentQueryId());
    }
    if (pendingAction?.type === "new") add();
    else if (pendingAction?.type === "select") select(pendingAction.id);
    setPendingAction(null);
  };
  const saveCurrent = async (): Promise<boolean> => {
    if (demo || !currentQuery) return false;
    setSaving(true);
    try {
      queriesStore.saveQuery(currentQueryId);
      message.success("Query saved.");
      return true;
    } catch {
      message.error("Could not save the query.");
      return false;
    } finally {
      setSaving(false);
    }
  };
  const saveAndContinue = async () => {
    if (await saveCurrent()) continueToPending();
  };

  return {
    demo,
    openQueries,
    currentQueryId,
    select: (id: string) => request({ type: "select", id }),
    add: () => request({ type: "new" }),
    rename,
    applyTemplate,
    updateDemoQuery,
    pendingAction,
    setPendingAction,
    continueToPending,
    saveAndContinue,
    saveCurrent,
    saving,
    canSave: !demo,
  };
}

type QueryBrowserProps = {
  model: ReturnType<typeof useQueryBrowser>;
};

const queryTime = (query: QueryInfo) => {
  const time = query.updatedAt ? Date.parse(query.updatedAt) : 0;
  return Number.isFinite(time) ? time : 0;
};

const sortedQueries = (queries: Record<string, QueryInfo>) =>
  Object.entries(queries).sort(([firstId, first], [secondId, second]) => {
    return (
      queryTime(second) - queryTime(first) || Number(secondId) - Number(firstId)
    );
  });

const timestampLabel = (updatedAt?: string) =>
  updatedAt && !Number.isNaN(Date.parse(updatedAt))
    ? `Last edited: ${new Date(updatedAt).toLocaleString()}`
    : "Timestamp unavailable for this older query";

export const QueryList = observer(
  ({ model, compact = false }: QueryBrowserProps & { compact?: boolean }) => {
    const [open, setOpen] = React.useState(false);
    const list = (
      <div className="query-list">
        <div className="query-list-header">
          <Typography.Text strong>Queries</Typography.Text>
          <Tooltip title="New query" placement="right">
            <Button
              type="text"
              size="small"
              aria-label="New query"
              icon={<PlusOutlined />}
              onClick={model.add}
            />
          </Tooltip>
        </div>
        <div
          className="query-list-scroll"
          role="tablist"
          aria-label="Open queries"
        >
          {sortedQueries(model.openQueries).map(([id, query]) => (
            <div
              className={`query-list-item ${id === model.currentQueryId ? "query-list-item-active" : ""}`}
              key={id}
            >
              <Tooltip
                title={timestampLabel(query.updatedAt)}
                placement="right"
              >
                <button
                  type="button"
                  role="tab"
                  aria-selected={id === model.currentQueryId}
                  aria-label={query.name}
                  className="query-list-select"
                  onClick={() => {
                    model.select(id);
                    setOpen(false);
                  }}
                >
                  {query.name}
                </button>
              </Tooltip>
            </div>
          ))}
        </div>
      </div>
    );

    if (!compact) return list;
    return (
      <div className="query-list-compact">
        <Tooltip title="New query" placement="right">
          <Button
            aria-label="New query"
            shape="circle"
            icon={<PlusOutlined />}
            onClick={model.add}
          />
        </Tooltip>
        <Popover
          content={list}
          title="Open queries"
          trigger="click"
          placement="rightTop"
          open={open}
          onOpenChange={setOpen}
        >
          <Tooltip title="Open queries" placement="right">
            <Button
              aria-label="Open queries"
              shape="circle"
              icon={<UnorderedListOutlined />}
            />
          </Tooltip>
        </Popover>
      </div>
    );
  }
);

const QueryBrowser = observer(({ model }: QueryBrowserProps) => {
  const nameInputRef = React.useRef<InputRef>(null);
  const currentQuery = model.openQueries[model.currentQueryId];
  const nameDirty =
    !model.demo &&
    !!currentQuery?.saved &&
    currentQuery.name !== currentQuery.saved.name;
  return (
    <>
      <div className="query-workspace-title">
        <Input
          ref={nameInputRef}
          key={model.currentQueryId}
          aria-label="Query name"
          value={model.openQueries[model.currentQueryId]?.name}
          onChange={(event) =>
            model.rename(model.currentQueryId, event.currentTarget.value)
          }
          onPressEnter={(event) => event.currentTarget.blur()}
        />
        <Tooltip title="Edit query name">
          <Button
            type="text"
            aria-label="Edit query name"
            icon={<EditOutlined />}
            onClick={() => nameInputRef.current?.focus({ cursor: "all" })}
          />
        </Tooltip>
        <Tooltip
          title={
            model.demo
              ? "Create an account to save queries"
              : nameDirty
                ? "Save query name"
                : "No changes to query name"
          }
        >
          <span>
            <Button
              aria-label="Save query name"
              type="text"
              icon={<SaveOutlined />}
              disabled={!nameDirty}
              loading={model.saving}
              onClick={() => void model.saveCurrent()}
            />
          </span>
        </Tooltip>
        <div className="query-workspace-tools">
          <Tooltip title="Copy query">
            <Button
              type="text"
              aria-label="Copy query"
              icon={<BiCopy size={18} />}
              onClick={() =>
                void navigator.clipboard.writeText(currentQuery?.sparql ?? "")
              }
            />
          </Tooltip>
          <Templates
            templates={sparqlTemplates}
            onApply={model.applyTemplate}
          />
        </div>
      </div>
      <Tabs
        className="query-browser"
        activeKey={model.currentQueryId}
        onChange={model.select}
        items={Object.entries(model.openQueries).map(([id, query]) => ({
          key: id,
          label: query.name,
          children: (
            <Query
              qid={id}
              demo={model.demo}
              demoQuery={model.demo ? query : undefined}
              onDemoQueryChange={(sparql) =>
                model.updateDemoQuery(id, { sparql })
              }
            />
          ),
        }))}
      />
      <Modal
        title={`Save changes to “${model.openQueries[model.currentQueryId]?.name}”?`}
        open={model.pendingAction !== null}
        onCancel={() => model.setPendingAction(null)}
        footer={[
          <Button key="cancel" onClick={() => model.setPendingAction(null)}>
            Cancel
          </Button>,
          <Button key="discard" onClick={model.continueToPending}>
            Continue without saving
          </Button>,
          ...(model.canSave
            ? [
                <Button
                  key="save"
                  type="primary"
                  loading={model.saving}
                  onClick={() => void model.saveAndContinue()}
                >
                  Save query and continue
                </Button>,
              ]
            : []),
        ]}
      >
        {model.demo
          ? "The sample workspace cannot save queries. Continue without saving your changes?"
          : "Save this query before moving on?"}
      </Modal>
    </>
  );
});

export default QueryBrowser;
