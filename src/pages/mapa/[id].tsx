"use client";
import "leaflet/dist/leaflet.css";
import { useEffect, useMemo } from "react";
import { useRouter } from "next/router";
import { useMapaStore } from "@/stores/mapaStore";

export default function Mapa() {
  const router = useRouter();
  const { clearStore, dispatch } = useMapaStore();
  const exemplos = useMemo(
    () => ["one-piece", "pequena-africa", "golpe-64", "novo"],
    []
  );

  useEffect(() => {
    if (
      router.query.id &&
      typeof router.query.id === "string" &&
      exemplos.includes(router.query.id)
    ) {
      clearStore(); // Limpa o store do Zustand
      if (router.query.id !== "novo") {
        const su = require(`@/pages/examples/${router.query.id}.json`);
        dispatch({ type: "reset", mapContext: su });
      }
      router.push("/mapa");
    }
  }, [exemplos, router, clearStore, dispatch]);
  return null;
}
