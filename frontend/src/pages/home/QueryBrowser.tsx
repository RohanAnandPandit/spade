import React from "react";
import { Input, Tabs } from "antd";
import Query from "../../components/query/Query";
import { useStore } from "../../stores/store";
import { observer } from "mobx-react-lite";
import "./QueryBrowser.css";
import { QueryInfo } from "../../types";

type TargetKey = React.MouseEvent | React.KeyboardEvent | string;

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

type QueryBrowserProps = {
  demo?: boolean;
};

const QueryBrowser = observer(({ demo = false }: QueryBrowserProps) => {
  const rootStore = useStore();
  const queriesStore = rootStore.queriesStore;
  const [demoTotal, setDemoTotal] = React.useState(1);
  const [demoCurrentQueryId, setDemoCurrentQueryId] = React.useState("1");
  const [demoQueries, setDemoQueries] = React.useState<
    Record<string, QueryInfo>
  >({
    "1": { name: "World countries", sparql: TRIAL_QUERY },
  });
  const openQueries = demo ? demoQueries : queriesStore.openQueries();
  const currentQueryId = demo
    ? demoCurrentQueryId
    : queriesStore.currentQueryId();

  const onTabChange = (newActiveKey: string) => {
    if (demo) setDemoCurrentQueryId(newActiveKey);
    else queriesStore.setCurrentQueryId(newActiveKey);
  };

  const add = () => {
    if (demo) {
      const nextTotal = demoTotal + 1;
      const id = `${nextTotal}`;
      setDemoTotal(nextTotal);
      setDemoQueries((queries) => ({
        ...queries,
        [id]: { name: `Query ${id}`, sparql: "" },
      }));
      setDemoCurrentQueryId(id);
    } else {
      onTabChange(queriesStore.addQuery());
    }
  };

  const remove = (targetKey: TargetKey) => {
    const id = targetKey as string;
    if (!demo) {
      queriesStore.removeQuery(id);
      return;
    }
    setDemoQueries((queries) => {
      const remaining = Object.fromEntries(
        Object.entries(queries).filter(([queryId]) => queryId !== id)
      );
      if (Object.keys(remaining).length === 0) {
        const replacementId = `${demoTotal + 1}`;
        setDemoTotal((total) => total + 1);
        setDemoCurrentQueryId(replacementId);
        return {
          [replacementId]: { name: `Query ${replacementId}`, sparql: "" },
        };
      }
      if (demoCurrentQueryId === id) {
        setDemoCurrentQueryId(Object.keys(remaining).at(-1)!);
      }
      return remaining;
    });
  };

  const updateDemoQuery = (id: string, updates: Partial<QueryInfo>) => {
    setDemoQueries((queries) => ({
      ...queries,
      [id]: { ...queries[id]!, ...updates },
    }));
  };

  const onEdit = (
    targetKey: React.MouseEvent | React.KeyboardEvent | string,
    action: "add" | "remove"
  ) => {
    if (action === "add") {
      add();
    } else {
      remove(targetKey);
    }
  };

  return (
    <Tabs
      className="query-browser"
      type="editable-card"
      onChange={onTabChange}
      activeKey={currentQueryId}
      onEdit={onEdit}
      items={Object.keys(openQueries).map((qid: string) => {
        return {
          label: (
            <Input
              title={openQueries[qid].name}
              onKeyDown={(e) => e.stopPropagation()}
              style={{
                margin: 0,
                cursor: "pointer",
                background: "none",
                borderTop: "none",
                borderLeft: "none",
                borderRight: "none",
              }}
              defaultValue={openQueries[qid].name}
              onPressEnter={(e) => {
                if (demo) updateDemoQuery(qid, { name: e.currentTarget.value });
                else queriesStore.setQueryTitle(qid, e.currentTarget.value);
              }}
              onBlur={(e) => {
                if (demo) updateDemoQuery(qid, { name: e.currentTarget.value });
                else queriesStore.setQueryTitle(qid, e.currentTarget.value);
              }}
            />
          ),
          children: (
            <Query
              qid={qid}
              demo={demo}
              demoQuery={demo ? openQueries[qid] : undefined}
              onDemoQueryChange={(sparql) => updateDemoQuery(qid, { sparql })}
            />
          ),
          key: qid,
        };
      })}
    />
  );
});

export default QueryBrowser;
