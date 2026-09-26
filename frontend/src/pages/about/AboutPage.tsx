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
        <h1>
          SPADE started as my final-year project at Imperial College London.
        </h1>
        <p className="about-intro">
          Professor Peter McBrien supervised the project. I wanted to explore a
          question: how can we find the most useful way to represent data, so
          its patterns and relationships are easier to understand?
        </p>

        <section
          className="about-question"
          aria-labelledby="about-question-title"
        >
          <p className="about-section-label">The idea</p>
          <h2 id="about-question-title">Finding the right view for the data</h2>
          <p>
            Different views reveal different things. A table provides detail; a
            chart can highlight a trend; a map, hierarchy, or network can show
            location, structure, or connections.
          </p>
          <p>
            SPADE investigates how the shape of RDF data and the results of a
            SPARQL query can inform which representation is most useful for the
            question being asked.
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
