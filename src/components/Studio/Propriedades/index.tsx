import React, { useEffect, useState, useRef } from "react";
import { Grid2, Chip, Tab, AppBar, Tabs, Box } from "@mui/material";
import { useMapaContext, useMapaDispatch } from "@/components/Mapa/MapaContext";
import { Rnd } from "react-rnd";
import AlignVerticalCenterIcon from "@mui/icons-material/AlignVerticalCenter";
import useWindowDimensions from "../useWindowDimensions";
import Cenas from "./cenas";
import Geral from "./geral";
import Elemento from "./elemento";
import { Map } from "leaflet";
import DraggerResize from "@/components/DraggerResize";
import ReprodutorLinhaTempo from "@/components/Mapa/ReprodutorLinhaTempo";

interface TabPanelProps {
  children?: React.ReactNode;
  dir?: string;
  index: number;
}

export default function Propriedades(props: {
  altura: number;
  tempoAtualRef: any;
  larguraPropriedades: number;
  setLargurasPropriedades: React.Dispatch<React.SetStateAction<number>>;
  map: Map;
}) {
  const {
    map,
    altura,
    tempoAtualRef,
    larguraPropriedades,
    setLargurasPropriedades,
  } = props;
  const { width } = useWindowDimensions();
  const mapaContext = useMapaContext();
  const dispatch = useMapaDispatch();
  const [rndRef, setRndRef] = useState<Rnd>();
  const [value, setValue] = React.useState(0);
  const tocadorRef = useRef(null);
  const headerTabRef = useRef(null);
  const timeOutIdRef = useRef(null);
  const tempoAtual = React.useRef(mapaContext.tempo);

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  tempoAtual.current = mapaContext.tempo;

  function TabPanel(props: TabPanelProps) {
    const formRef = React.useRef(null);
    const scrollRef = React.useRef(0);

    React.useEffect(() => {
      if ((window as any).scrollRef && formRef.current) {
        formRef.current.scrollTop = (window as any).scrollRef;
      }
      formRef.current.onscrollend = (x) => {
        scrollRef.current = x.srcElement.scrollTop;
      };
      return () => {
        if (scrollRef.current) (window as any).scrollRef = scrollRef.current;
      };
    }, []);
    const { children, index, ...other } = props;
    return (
      <div
        ref={formRef}
        role="tabpanel"
        hidden={value !== index}
        id={`full-width-tabpanel-${index}`}
        className={"tabPanel-propriedades"}
        aria-labelledby={`full-width-tab-${index}`}
        style={{
          maxHeight:
            headerTabRef?.current && tocadorRef?.current
              ? altura -
                tocadorRef.current.offsetHeight -
                headerTabRef.current.offsetHeight
              : altura * 0.75,
          overflow: "auto",
        }}
        {...other}
      >
        {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
      </div>
    );
  }

  function propriedadesTab(index: number) {
    return {
      id: `full-width-tab-${index}`,
      "aria-controls": `full-width-tabpanel-${index}`,
      sx: value === index ? { bgcolor: "#1976d245" } : {},
      value: index,
    };
  }
  const displaYNoneStyle = { display: "none" };

  useEffect(() => {
    const val =
      mapaContext.elementoFoco ||
      (mapaContext.elementosFoco && mapaContext.elementosFoco.length)
        ? 2
        : 0;
    setValue(val);
  }, [mapaContext.elementoFoco, mapaContext.elementosFoco]);

  React.useEffect(() => {
    const elemento = document.getElementById("seletorResize");
    if (elemento) elemento.parentElement.id = "parentSeletorResize";
  }, []);

  return (
    mapaContext?.slidePropriedade && (
      <Grid2
        sx={{
          borderLeft: 2,
          borderLeftStyle: "outset",
        }}
      >
        <div
          style={{
            width: larguraPropriedades,
            maxWidth: width * 0.6,
            minWidth: width * 0.1,
            height: altura,
          }}
          id="foraDIv"
        >
          <Rnd
            ref={(r) => {
              setRndRef(r);
            }}
            maxWidth={width * 0.6}
            minWidth={width * 0.1}
            resizeHandleStyles={{
              right: displaYNoneStyle,
              topLeft: displaYNoneStyle,
              topRight: displaYNoneStyle,
              bottomLeft: displaYNoneStyle,
              bottomRight: displaYNoneStyle,
            }}
            resizeHandleComponent={{
              left: (
                <DraggerResize>
                  <Chip
                    color="default"
                    size="small"
                    icon={<AlignVerticalCenterIcon />}
                    style={{
                      cursor: "e-resize",
                      position: "relative",
                      top: "50%",
                      left: 10,
                    }}
                  />
                </DraggerResize>
              ),
            }}
            size={{ height: altura, width: larguraPropriedades }}
            disableDragging
            onResize={(e, dir, ref) => {
              if (rndRef && rndRef.updatePosition)
                rndRef?.updatePosition({ x: width - ref.offsetWidth, y: 0 });
              setLargurasPropriedades(ref.offsetWidth);
              if (timeOutIdRef.current) clearTimeout(timeOutIdRef.current);
              timeOutIdRef.current = setTimeout(() => {
                dispatch({
                  type: "alteraPropriedadeGeral",
                  nomePropriedade: "larguraPropriedades",
                  valorPropriedade: ref.offsetWidth,
                });
              }, 250);
            }}
          >
            <AppBar
              position="static"
              sx={{
                borderLeft: 2,
                borderLeftStyle: "inset",
              }}
              ref={headerTabRef}
            >
              <Tabs
                value={
                  (
                    mapaContext.elementosFoco?.concat(
                      mapaContext.elementoFoco
                    ) ?? [mapaContext.elementoFoco]
                  ).filter((x) => !!x).length > 0
                    ? value
                    : value > 1
                    ? 0
                    : value
                }
                onChange={handleChange}
                sx={{ bgcolor: "#e5e7eb" }}
                indicatorColor="secondary"
                variant="fullWidth"
                aria-label="full width tabs example"
              >
                {(
                  mapaContext.elementosFoco?.concat(
                    mapaContext.elementoFoco
                  ) ?? [mapaContext.elementoFoco]
                ).filter((x) => !!x).length > 0 && (
                  <Tab label="Elemento" {...propriedadesTab(2)} />
                )}
                <Tab label="Geral" {...propriedadesTab(0)} />
                <Tab label="Cenas" {...propriedadesTab(1)} />
              </Tabs>
            </AppBar>
            {(
              mapaContext.elementosFoco?.concat(mapaContext.elementoFoco) ?? [
                mapaContext.elementoFoco,
              ]
            ).filter((x) => !!x).length > 0 && (
              <TabPanel index={2}>
                <Elemento map={map} />
              </TabPanel>
            )}
            <TabPanel index={0}>
              <Geral />
            </TabPanel>
            <TabPanel index={1}>
              <Cenas />
            </TabPanel>

            <ReprodutorLinhaTempo tempoAtualRef={tempoAtualRef} />
          </Rnd>
        </div>
        {/* Lateral direita */}
      </Grid2>
    )
  );
}
