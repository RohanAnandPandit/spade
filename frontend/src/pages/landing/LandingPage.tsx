import type { CSSProperties } from "react";
import { Button, theme } from "antd";
import {
  BarChartOutlined,
  DatabaseOutlined,
  NodeIndexOutlined,
  PlayCircleOutlined,
} from "@ant-design/icons";
import { Link } from "react-router-dom";
import { observer } from "mobx-react-lite";
import { useStore } from "../../stores/store";
import "./LandingPage.css";

const LandingPage = observer(() => {
  const { authStore } = useStore();
  const { token } = theme.useToken();
  const workspacePath = authStore.user ? "/workspace" : "/register";

  const landingStyle = {
    "--landing-bg": token.colorBgLayout,
    "--landing-surface": token.colorBgContainer,
    "--landing-text": token.colorText,
    "--landing-muted": token.colorTextSecondary,
    "--landing-border": token.colorBorderSecondary,
    "--landing-primary": token.colorPrimary,
  } as CSSProperties;

  return (
    <main className="landing-page" style={landingStyle}>
      <section className="landing-hero">
        <div className="hero-copy">
          <p className="eyebrow">SPARQL Analyser &amp; Data Explorer</p>
          <h1>Understand linked data without losing the thread.</h1>
          <p className="hero-summary">
            SPADE brings RDF exploration, SPARQL querying, and visual analysis
            into one focused workspace. Inspect a dataset, shape a query, and
            turn the results into a view that makes the relationships clear.
          </p>
          <div className="hero-actions">
            <Link to={workspacePath}>
              <Button type="primary" size="large" icon={<PlayCircleOutlined />}>
                {authStore.user ? "Open workspace" : "Start exploring"}
              </Button>
            </Link>
            {!authStore.user && (
              <Link className="secondary-action" to="/login">
                Already have an account? Sign in
              </Link>
            )}
          </div>
        </div>

        <div className="query-preview" aria-label="Example SPARQL query">
          <div className="preview-bar">
            <span>Query workspace</span>
            <span className="preview-status">Ready</span>
          </div>
          <pre>
            <code>
              <span className="query-keyword">SELECT</span> ?person ?name{"\n"}
              <span className="query-keyword">WHERE</span> {" {"}
              {"\n"}
              {"  "}?person a schema:Person ;{"\n"}
              {"          "}schema:name ?name .{"\n"}
              {"}"}
              {"\n"}
              <span className="query-keyword">LIMIT</span> 100
            </code>
          </pre>
          <div className="preview-result">
            <span>100 results</span>
            <div className="result-bars" aria-hidden>
              <i />
              <i />
              <i />
              <i />
              <i />
            </div>
          </div>
        </div>
      </section>

      <section className="landing-features" aria-labelledby="features-title">
        <div className="section-heading">
          <p className="eyebrow">One connected workflow</p>
          <h2 id="features-title">From unfamiliar graph to useful answer</h2>
        </div>
        <div className="feature-grid">
          <article className="feature-card">
            <DatabaseOutlined aria-hidden />
            <h3>Explore the dataset</h3>
            <p>
              Inspect classes, properties, instances, and links before writing a
              query, so the shape of the data is never a guessing game.
            </p>
          </article>
          <article className="feature-card">
            <NodeIndexOutlined aria-hidden />
            <h3>Build and analyse queries</h3>
            <p>
              Work with SPARQL in a dedicated editor, revisit query history, and
              examine how result columns relate to one another.
            </p>
          </article>
          <article className="feature-card">
            <BarChartOutlined aria-hidden />
            <h3>See the result clearly</h3>
            <p>
              Move beyond rows and columns with charts, maps, hierarchies, and
              network views suited to the structure of each result.
            </p>
          </article>
        </div>
      </section>

      <section className="landing-cta">
        <div>
          <p className="eyebrow">Ready when your data is</p>
          <h2>Bring your RDF data into focus.</h2>
        </div>
        <Link to={workspacePath}>
          <Button type="primary" size="large">
            {authStore.user ? "Return to workspace" : "Create an account"}
          </Button>
        </Link>
      </section>

      <footer className="landing-footer">
        <span>
          © {new Date().getFullYear()}{" "}
          <a
            href="https://www.rohanpandit.com/"
            target="_blank"
            rel="noreferrer"
          >
            Rohan Pandit
          </a>
        </span>
      </footer>
    </main>
  );
});

export default LandingPage;
