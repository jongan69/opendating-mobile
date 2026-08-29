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
        <link rel="canonical" href="https://opendating.org/" />
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
