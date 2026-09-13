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
          <p className="eyebrow">Explore connected data</p>
          <h1>Find answers in complex data, then see the connections.</h1>
          <p className="hero-summary">
            SPADE stands for SPARQL Analysis and Data Explorer. It helps you
            understand what a dataset contains, ask precise questions, and turn
            the answers into tables, charts, maps, or relationship diagrams. Try
            it with our sample world dataset. No setup required.
          </p>
          <div className="hero-actions">
            <Link to="/try">
              <Button type="primary" size="large" icon={<PlayCircleOutlined />}>
                Try sample dataset
              </Button>
            </Link>
            {authStore.user ? (
              <Link className="secondary-action" to="/workspace">
                Open workspace
              </Link>
            ) : (
              <Link className="secondary-action" to="/register">
                Or create an account
              </Link>
            )}
          </div>
        </div>

        <div className="query-preview" aria-label="Sample data question">
          <div className="preview-bar">
            <span>Sample question</span>
            <span className="preview-status">Ready</span>
          </div>
          <pre>
            <code>
              <span className="query-comment">
                # Which countries have the largest populations?
              </span>
              {"\n\n"}
              <span className="query-keyword">SELECT</span> ?country ?population
              {"\n"}
              <span className="query-keyword">WHERE</span> {" {"}
              {"\n"}
              {"  "}?place a mondial:Country ;{"\n"}
              {"         "}mondial:name ?country ;{"\n"}
              {"         "}mondial:population ?population .{"\n"}
              {"}"}
              {"\n"}
              <span className="query-keyword">ORDER BY</span> DESC(?population)
              {"\n"}
              <span className="query-keyword">LIMIT</span> 10
            </code>
          </pre>
          <div className="preview-result">
            <span>10 countries</span>
            <Link className="preview-try-link" to="/try">
              Open sample dataset →
            </Link>
          </div>
        </div>
      </section>

      <section className="landing-features" aria-labelledby="features-title">
        <div className="section-heading">
          <p className="eyebrow">One clear workflow</p>
          <h2 id="features-title">From unfamiliar data to a useful answer</h2>
        </div>
        <div className="feature-grid">
          <article className="feature-card">
            <DatabaseOutlined aria-hidden />
            <h3>See what is inside</h3>
            <p>
              Browse the kinds of information available, inspect examples, and
              understand how different records relate before asking questions.
            </p>
          </article>
          <article className="feature-card">
            <NodeIndexOutlined aria-hidden />
            <h3>Ask a precise question</h3>
            <p>
              Start from a ready-made example or write your own query. Save
              useful questions so you can return to them later.
            </p>
          </article>
          <article className="feature-card">
            <BarChartOutlined aria-hidden />
            <h3>Choose the clearest view</h3>
            <p>
              Read the answer as a table, chart, map, hierarchy, or network,
              depending on what makes the result easiest to understand.
            </p>
          </article>
        </div>
      </section>

      <section className="landing-cta">
        <div>
          <p className="eyebrow">Bring your own data</p>
          <h2>Explore it in one focused workspace.</h2>
        </div>
        <Link to={authStore.user ? "/workspace" : "/register"}>
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
