import type { ReactNode } from 'react';
import {
  ScrollViewStyleReset,
  useServerDocumentContext,
} from 'expo-router/html';

const PRODUCT_JSON_LD = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'OpenDating',
  url: 'https://opendating-mobile.expo.app/',
  description:
    'A browser dating app built around deliberate introductions, coarse location, private decisions, and end-to-end encrypted direct messages.',
  applicationCategory: 'LifestyleApplication',
  operatingSystem: 'Web',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'USD',
  },
  sameAs: [
    'https://github.com/jongan69/opendating-mobile',
    'https://github.com/jongan69/OpenDating',
  ],
  subjectOf: 'https://opendating-mobile.expo.app/about/',
};

export default function RootHtml({ children }: { children: ReactNode }) {
  const { bodyAttributes, bodyNodes, headNodes, htmlAttributes } =
    useServerDocumentContext();

  return (
    <html {...htmlAttributes} lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta
          httpEquiv="Content-Security-Policy"
          content="default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'none'; form-action 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https:; font-src 'self' data:; connect-src 'self' https://opendating-relay.jonathang132298.workers.dev wss://opendating-relay.jonathang132298.workers.dev https:; worker-src 'self' blob:; media-src 'self' blob: https:"
        />
        <meta name="referrer" content="no-referrer" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, shrink-to-fit=no"
        />
        <title>OpenDating — Private by design</title>
        <meta
          name="description"
          content="A thoughtful dating experience built around coarse location, encrypted conversations, and identity you control."
        />
        <meta property="og:title" content="OpenDating — Private by design" />
        <meta
          property="og:description"
          content="Dating built around genuine connection, not surveillance."
        />
        <meta
          property="og:image"
          content="https://opendating-mobile.expo.app/images/lockup-coral.png"
        />
        <meta property="og:type" content="website" />
        <meta name="color-scheme" content="light dark" />
        <meta name="theme-color" content="#FAF9F7" media="(prefers-color-scheme: light)" />
        <meta name="theme-color" content="#141413" media="(prefers-color-scheme: dark)" />
        <style
          dangerouslySetInnerHTML={{
            __html:
              '*:focus-visible{outline:3px solid #D95F59!important;outline-offset:3px}html,body{background:#FAF9F7}button,input,textarea{font:inherit}@media(prefers-color-scheme:dark){html,body{background:#141413}}',
          }}
        />
        <link
          rel="sitemap"
          type="application/xml"
          href="https://opendating-mobile.expo.app/sitemap.xml"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(PRODUCT_JSON_LD) }}
        />
        <ScrollViewStyleReset />
        {headNodes}
      </head>
      <body {...bodyAttributes}>
        {children}
        {bodyNodes}
      </body>
    </html>
  );
}
