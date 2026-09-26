import type { CSSProperties } from "react";
import { ArrowRightOutlined } from "@ant-design/icons";
import { Button, theme } from "antd";
import { Link } from "react-router-dom";
import "./AboutPage.css";

const AboutPage = () => {
  const { token } = theme.useToken();
  const pageStyle = {
    "--about-bg": token.colorBgLayout,
    "--about-surface": token.colorBgContainer,
    "--about-text": token.colorText,
    "--about-muted": token.colorTextSecondary,
    "--about-border": token.colorBorderSecondary,
    "--about-primary": token.colorPrimary,
  } as CSSProperties;

  return (
    <main className="about-page" style={pageStyle}>
      <div className="about-content">
        <p className="about-eyebrow">About SPADE</p>
        <h1>Built to make connected data easier to explore.</h1>
        <p className="about-intro">
          SPADE stands for SPARQL Analysis and Data Explorer. It brings
          querying, analysis, and visualisation together in one workspace.
        </p>

        <section className="about-origin" aria-labelledby="about-origin-title">
          <p className="about-section-label">The story</p>
          <h2 id="about-origin-title">Where it started</h2>
          <p>
            I started SPADE as my final-year project at Imperial College London,
            with Professor Peter McBrien as my supervisor.
          </p>
          <p>
            The project is now a place to explore a dataset, write SPARQL
            queries, and see the results in tables and charts.
          </p>
        </section>

        <div className="about-action">
          <div>
            <h2>See SPADE in action</h2>
            <p>Try the sample Mondial dataset without creating an account.</p>
          </div>
          <Link to="/try">
            <Button type="primary" icon={<ArrowRightOutlined aria-hidden />}>
              Try the sample workspace
            </Button>
          </Link>
        </div>
      </div>
    </main>
  );
};

export default AboutPage;
