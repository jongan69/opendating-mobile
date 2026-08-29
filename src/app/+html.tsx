import type { ReactNode } from 'react';
import {
  ScrollViewStyleReset,
  useServerDocumentContext,
} from 'expo-router/html';

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
          content="https://opendating.org/images/lockup-coral.png"
        />
        <meta name="theme-color" content="#FAF9F7" />
        <style
          dangerouslySetInnerHTML={{
            __html:
              '*:focus-visible{outline:3px solid #D95F59!important;outline-offset:3px}body{background:#EDE9E4}button,input,textarea{font:inherit}',
          }}
        />
        <link rel="canonical" href="https://opendating-mobile.expo.app/" />
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
