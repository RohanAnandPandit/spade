import React from "react";
import { Col, Layout, QRCodeProps, Row, theme, Image } from "antd";
import Paragraph from "antd/es/typography/Paragraph";
import { QRCode } from "antd";

const { Sider, Content, Footer } = Layout;

const links: QRCodeProps[] = [
  {
    value: "https://www.linkedin.com/in/rohananandpandit/",
    icon: "https://cdn-icons-png.flaticon.com/512/174/174857.png",
  },
  {
    value: "mailto:rohananandpandit@gmail.com",
    icon: "https://cdn-icons-png.flaticon.com/512/5968/5968534.png",
  },
  {
    value: "https://wa.me/4407448777120",
    icon: "https://cdn-icons-png.flaticon.com/512/5968/5968841.png",
  },
];

const ContactPage: React.FC = () => {
  const {
    token: { colorBgContainer },
  } = theme.useToken();

  return (
    <>
      <Sider width={200} style={{ background: colorBgContainer }}>
        <Image width={200} src="rohan-profile-pic.jpg" />
      </Sider>
      <Layout style={{ padding: "0 24px 24px" }}>
        <Content
          style={{
            padding: 24,
            margin: 0,
            background: colorBgContainer,
          }}
        >
          <Paragraph>
            My name is Rohan Pandit and I am a Computing student at Imperial
            College London.
          </Paragraph>
          <Links links={links} />
        </Content>
        <Footer>
          <a
            href="https://www.flaticon.com/free-icons/"
            title="icons"
            target="_blank"
            rel="noreferrer"
          >
            All icons created by Freepik - Flaticon
          </a>
        </Footer>
      </Layout>
    </>
  );
};

const Links = ({ links }: any) => {
  return (
    <>
      <Row gutter={16}>
        {links.map(({ value, icon }: any, index: number) => (
          <Col key={`col-${index}`} className="gutter-row" span={8}>
            <a
              key={`link-${index}`}
              href={value}
              target="_blank"
              rel="noreferrer"
            >
              <QRCode
                style={{ margin: "auto", marginTop: 5 }}
                value={value}
                icon={icon}
              />
            </a>
          </Col>
        ))}
      </Row>
    </>
  );
};
export default ContactPage;
