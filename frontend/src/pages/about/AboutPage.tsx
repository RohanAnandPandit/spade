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
        <h1>What is the best way to represent data?</h1>
        <p className="about-intro">
          A table can give a precise answer, but it does not always reveal a
          pattern. A chart, map, hierarchy, or network can each show something
          different about the same data. SPADE explores how to choose a view
          that fits the data and the question being asked.
        </p>

        <section className="about-origin" aria-labelledby="about-origin-title">
          <p className="about-section-label">The story</p>
          <h2 id="about-origin-title">Where it started</h2>
          <p>
            I started SPADE as my final-year project at Imperial College London,
            with Professor Peter McBrien as my supervisor.
          </p>
          <p>
            The project investigates how the structure and relationships in RDF
            data can guide the way query results are presented. SPARQL helps
            uncover the data; the larger question is which representation makes
            its patterns and connections clearest.
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
