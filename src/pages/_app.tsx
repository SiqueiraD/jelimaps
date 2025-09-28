import "@/styles/globals.css";
import React from "react";
import { SessionProvider } from "next-auth/react";
import type { AppProps } from "next/app";
import "bootstrap/dist/css/bootstrap.min.css";
import { GoogleAnalytics } from "nextjs-google-analytics";
import CaixaDialogoProvider from "@/components/CaixaDialogo/CaixaDialogoProvider";
import { BarraAlertaProvider } from "@/components/BarraAlerta/BarraAlertaProvider";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterMoment } from "@mui/x-date-pickers/AdapterMoment";

export default function App({
  Component,
  pageProps: { session, ...pageProps },
}: AppProps) {
  return (
    <SessionProvider session={session}>
      <GoogleAnalytics trackPageViews />
      <LocalizationProvider dateAdapter={AdapterMoment}>
        <Component {...pageProps} />
      </LocalizationProvider>
      <CaixaDialogoProvider />
      <BarraAlertaProvider />
    </SessionProvider>
  );
}
