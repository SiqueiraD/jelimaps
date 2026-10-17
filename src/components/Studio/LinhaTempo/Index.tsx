import { useMapaContext } from "@/components/Mapa/MapaContext";
import { Grid2 } from "@mui/material";
import React from "react";
import SimpleTimeline from "./SimpleTimeline";
import VisTimeline from "./VisTimeline";

export default function LinhaTempo(props: {
  tempoAtualRef: React.MutableRefObject<any>;
  altura: number;
}) {
  const mapaContext = useMapaContext();
  return (
    <Grid2
      id={"oi"}
      size={12}
      sx={{
        height: "100%",
        ".personalized-scrollbar": {
          height: "100%",
          // "div:first-child": {
          //   height: "100%",
          // },
          ".vis-timeline": {
            height: "100% !important",
          },
          ".vis-vertical-scroll": {
            "&::-webkit-scrollbar": {
              width: 7,
            },
            "&::-webkit-scrollbar-thumb": {
              backgroundColor: "darkgrey",
              outline: `1px solid slategrey`,
            },
          },
        },
      }}
    >
      {mapaContext.timelineMode === "simple" ? (
        <SimpleTimeline />
      ) : (
        <VisTimeline tempoAtualRef={props.tempoAtualRef} altura={props.altura} />
      )}
    </Grid2>
  );
}
