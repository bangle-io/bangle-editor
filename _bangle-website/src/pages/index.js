import React from 'react';
import clsx from 'clsx';
import Layout from '@theme/Layout';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import useBaseUrl from '@docusaurus/useBaseUrl';
import styles from './styles.module.css';
import BrowserOnly from '@docusaurus/BrowserOnly';
import Example from '../landing-example';

const features = [
  {
    title: '🔋Batteries included',
    // imageUrl: 'img/undraw_docusaurus_mountain.svg',
    description: <>Comes with TodoLists, Heading, Lists and many more.</>,
  },
  {
    title: 'Interactivity',
    description: <>Collboration, Split screen, Suggestions</>,
  },
  {
    title: 'React',
    description: <>Build your own editable components with React.</>,
  },
];

function Feature({ emoji, imageUrl, title, description }) {
  const imgUrl = useBaseUrl(imageUrl);
  return (
    <div className={clsx('col col--4', styles.feature)}>
      {emoji && <h1 className="text--center">{emoji}</h1>}
      {imgUrl && (
        <div className="text--center">
          <img className={styles.featureImage} src={imgUrl} alt={title} />
        </div>
      )}
      <h3 className="text--center">{title}</h3>
      <p className="text--center">{description}</p>
    </div>
  );
}

function Home() {
  const context = useDocusaurusContext();
  const { siteConfig = {} } = context;
  return (
    <Layout
      title={`Hello from ${siteConfig.title}`}
      description="Description will go into a meta tag in <head />"
    >
      <header className={clsx('hero hero--primary', styles.heroBanner)}>
        <div className="container">
          <h1 className="hero__title">{siteConfig.title}</h1>
          <p className="hero__subtitle">{siteConfig.tagline}</p>
          <div className={styles.buttons}>
            <Link
              className={clsx(
                'button button--outline button--secondary button--lg',
                styles.getStarted,
              )}
              to={useBaseUrl('docs/')}
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>
      <main
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div style={{ width: 'max(70vw, 200px)', margin: '1rem' }}>
          <BrowserOnly>{() => <Example />}</BrowserOnly>
        </div>
        {/* {features && features.length > 0 && (
          <section className={styles.features}>
            <div className="container">
              <div className="row">
                {features.map((props, idx) => (
                  <Feature key={idx} {...props} />
                ))}
              </div>
            </div>
          </section>
        )} */}
      </main>
    </Layout>
  );
}

export default Home;
