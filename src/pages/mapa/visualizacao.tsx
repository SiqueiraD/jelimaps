"use client";
import "leaflet/dist/leaflet.css";
import { useEffect } from "react";
import { GetServerSideProps } from "next";
import { getServerSession } from "next-auth/next";
import { useRouter } from "next/router";
import { authOptions } from "@/pages/api/auth/[...nextauth]";
import { carregarMapa, MapaCompleto } from "@/services/supabaseMapaService";
import { useMapaStore } from "@/stores/mapaStore";

interface Props {
  mapa: MapaCompleto;
}

export default function Visualizacao({ mapa }: Props) {
  const router = useRouter();
  const { clearStore, dispatch, setSavedMap } = useMapaStore();

  useEffect(() => {
    clearStore();
    dispatch({ type: "reset", mapContext: mapa.informacoes });
    setSavedMap(mapa.id, mapa.titulo);
    router.push("/mapa");
  }, [mapa, clearStore, dispatch, setSavedMap, router]);

  return null;
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { id } = context.query;

  if (!id || typeof id !== "string") {
    return { notFound: true };
  }

  const session = await getServerSession(context.req, context.res, authOptions);

  try {
    const mapa = await carregarMapa(session, id);
    if (!mapa) return { notFound: true };
    return { props: { mapa } };
  } catch (err: unknown) {
    if (err instanceof Error && err.message === "PERMISSION_DENIED") {
      return { redirect: { destination: "/403", permanent: false } };
    }
    return { notFound: true };
  }
};
