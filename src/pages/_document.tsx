import React from "react";
import { Html, Head, Main, NextScript } from "next/document";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from '@vercel/speed-insights/next';
import Script from "next/script";

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <script
          async
          src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID}`}
        ></script>
        <Script id="google-tag-manager" strategy="afterInteractive">
          {`
          window.dataLayer = window.dataLayer || []; function gtag(){dataLayer.push(arguments);} gtag('js', new Date()); gtag('config', '${process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID}');
          `}
        </Script>
      </Head>
      <body>
        <Main />
        <Analytics />
        <NextScript />
        <SpeedInsights />
      </body>
    </Html>
  );
}
