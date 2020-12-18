module.exports = {
  title: 'BangleJS',
  tagline: 'Toolkit for building modern wysiwyg editors.',
  url: 'https://bangle-io.github.io/banglejs/',
  baseUrl: process.env.CI ? '/banglejs/' : '/',
  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'throw',
  favicon: 'img/favicon.ico',
  organizationName: 'bangle.io', // Usually your GitHub org/user name.
  projectName: 'BangleJS', // Usually your repo name.
  themeConfig: {
    navbar: {
      title: 'BangleJS',
      logo: {
        alt: 'BangleJS Logo',
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
          href: 'https://github.com/kepta/bangle-play',
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
              label: 'Style Guide',
              to: 'docs/',
            },
          ],
        },
        {
          title: 'Community',
          items: [
            {
              label: 'Stack Overflow',
              href: 'https://stackoverflow.com/questions/tagged/docusaurus',
            },
            {
              label: 'Discord',
              href: 'https://discordapp.com/invite/docusaurus',
            },
            {
              label: 'Twitter',
              href: 'https://twitter.com/docusaurus',
            },
          ],
        },
        {
          title: 'More',
          items: [
            {
              label: 'Blog',
              to: 'blog',
            },
            {
              label: 'GitHub',
              href: 'https://github.com/facebook/docusaurus',
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} BangleJS, Inc. Built with Docusaurus.`,
    },
  },
  presets: [
    [
      '@docusaurus/preset-classic',
      {
        docs: {
          sidebarPath: require.resolve('./docsSidebar.js'),
          // Please change this to your repo.
          editUrl:
            'https://github.com/kepta/bangle-play/edit/master/_bangle-website/docs',
        },
        blog: {
          showReadingTime: true,
          // Please change this to your repo.
          editUrl:
            'https://github.com/kepta/bangle-play/edit/master/_bangle-website/blog/',
        },
        theme: {
          customCss: require.resolve('./src/css/custom.css'),
        },
      },
    ],
  ],
};
