// import { UnControlled as CodeMirror } from "react-codemirror2";
import CodeMirror from "@uiw/react-codemirror";
import "codemirror/addon/edit/closebrackets";
import "codemirror/mode/sparql/sparql";
import "codemirror/addon/hint/show-hint";
import "codemirror/addon/hint/anyword-hint";
import { StreamLanguage } from "@codemirror/language";
import { sparql } from "@codemirror/legacy-modes/mode/sparql";
import { duotoneLight, duotoneDark } from "@uiw/codemirror-theme-duotone";
import { autocompletion, CompletionContext } from "@codemirror/autocomplete";

type CodeEditorProps = {
  code: string;
  setCode: (text: string) => void;
  language: string;
  completions: {
    keywords?: string[];
    properties?: string[];
    variables?: string[];
    types?: string[];
  };
  darkTheme: boolean;
  width: number;
  height: number;
};

const languageParsers: any = {
  sparql: sparql,
};

const CodeEditor = ({
  code,
  setCode,
  language,
  completions,
  darkTheme,
  width,
  height,
}: CodeEditorProps) => {
  const myCompletions = (context: CompletionContext) => {
    let word = context.matchBefore(/(\w|[<>?])*/)!;
    if (word.from === word.to && !context.explicit) return null;
    return {
      from: word.from,
      options: getCompletions(completions),
    };
  };

  return (
    <CodeMirror
      value={code}
      basicSetup={{
        autocompletion: true,
      }}
      width={`${width}px`}
      height="auto"
      minHeight="200px"
      placeholder="Enter your SPARQl query here"
      extensions={[
        StreamLanguage.define(languageParsers[language]),
        autocompletion({ override: [myCompletions] }),
      ]}
      onChange={(value: string, viewUpdate: any) => {
        setCode(value);
      }}
      theme={darkTheme ? duotoneDark : duotoneLight}
      style={{ margin: 5 }}
    />
  );
};

function getCompletions({
  keywords,
  properties,
  variables,
  types,
}: {
  keywords?: string[];
  properties?: string[];
  variables?: string[];
  types?: string[];
}) {
  return [
    ...(keywords ?? []).map((kw) => {
      return {
        label: kw,
        type: "keyword",
        detail: "SPARQL keyword",
      };
    }),
    ...(properties ?? []).map((prop) => {
      return {
        label: prop,
        type: "property",
        detail: "property",
      };
    }),
    ...(variables ?? []).map((v) => {
      return {
        label: v,
        type: "variable",
        detail: "variable",
      };
    }),
    ...(types ?? []).map((t) => {
      return {
        label: t,
        type: "type",
        detail: "type",
      };
    }),
  ];
}

export default CodeEditor;
