module.exports = {
  title: 'bangle.dev',
  tagline: 'Toolkit for building modern wysiwyg editors.',
  url: 'https://bangle.dev',
  baseUrl: '/',
  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'throw',
  favicon: 'img/favicon.ico',
  organizationName: 'bangle-io', // Usually your GitHub org/user name.
  projectName: 'bangle.dev', // Usually your repo name.
  themeConfig: {
    navbar: {
      title: 'bangle.dev',
      logo: {
        alt: 'bangle.dev Logo',
        src: 'img/logo.png',
      },
      items: [
        {
          to: 'docs/',
          activeBasePath: 'docs',
          label: 'Docs',
          position: 'left',
        },
        // { to: 'blog', label: 'Blog', position: 'left' },
        { to: 'community/', label: 'Community', position: 'left' },
        {
          href: 'https://github.com/bangle-io/bangle.dev',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Docs',
          items: [
            {
              label: 'Getting Started',
              to: 'docs/getting-started',
            },
            {
              label: 'API',
              to: 'docs/api/core',
            },
            {
              label: 'Examples',
              to: 'docs/examples/markdown-editor',
            },
          ],
        },
        {
          title: 'Community',
          items: [
            {
              label: 'Discord',
              href: 'https://discord.gg/hFPnbPy8nK',
            },
            {
              label: 'Twitter',
              href: 'https://twitter.com/kushan2020',
            },
            {
              label: 'GitHub',
              href: 'https://github.com/bangle-io/bangle.dev',
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} Bangle.dev, Inc. Built with Docusaurus.`,
    },
    algolia: {
      apiKey: '17284b4121110575d7dedf56e2c02a62',
      indexName: 'bangle',

      // Optional: see doc section bellow

      // Optional: Algolia search parameters
      searchParameters: {},
    },
  },
  presets: [
    [
      '@docusaurus/preset-classic',
      {
        docs: {
          sidebarPath: require.resolve('./docsSidebar.js'),
          editUrl:
            'https://github.com/bangle-io/bangle.dev/edit/master/_bangle-website/',
        },
        blog: {
          showReadingTime: true,
          editUrl:
            'https://github.com/bangle-io/bangle.dev/edit/master/_bangle-website/blog/',
        },
        theme: {
          customCss: require.resolve('./src/css/custom.css'),
        },
      },
    ],
  ],
};
