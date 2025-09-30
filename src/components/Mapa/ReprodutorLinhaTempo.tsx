import {
  DesktopWindows,
  Pause,
  PlayArrow,
  SkipNext,
  SkipPrevious,
  Stop,
} from "@mui/icons-material";
import { BottomNavigation, BottomNavigationAction, Paper } from "@mui/material";
import { useMapaContext, useMapaDispatch } from "./MapaContext";
import moment from "moment";
import React from "react";

const ReprodutorLinhaTempo = (propsReprodutor: {
  tempoAtualRef?: any;
  isApresentacao?: boolean;
}) => {
  const { tempoAtualRef, isApresentacao } = propsReprodutor;
  const mapaContext = useMapaContext();
  const dispatch = useMapaDispatch();
  const tocadorRef = React.useRef(null);
  const [intervalId, setIntervalId] = React.useState(null);
  const [reproduzindo, setReproduzindo] = React.useState(false);
  const tempoAtual = React.useRef(mapaContext.tempo);
  const getMapaContext = React.useCallback(() => mapaContext, [mapaContext]);

  tempoAtual.current = mapaContext.tempo;

  const handleIntervaloAtualizaTempo = React.useCallback(() => {
    const _mapaContext = getMapaContext();
    const time = moment(tempoAtual.current)
      .add(
        moment(_mapaContext.cenaFim).diff(
          _mapaContext.cenaInicio,
          "milliseconds"
        ) / (_mapaContext.duracaoApresentacao ?? 10000),
        "seconds"
      )
      .format("yyyy-MM-DDTHH:mm:ss");
    if (time >= _mapaContext.cenaInicio && time <= _mapaContext.cenaFim)
      dispatch({
        type: "atualizaTempo",
        time,
      });
    if (tempoAtualRef) tempoAtualRef.current = time;
  }, [getMapaContext, tempoAtualRef, dispatch, tempoAtual]);

  return (
    <Paper
      sx={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        overflow: "scroll",
      }}
      elevation={3}
      ref={tocadorRef}
    >
      {isApresentacao && (
        <BottomNavigation
          sx={{ minWidth: 230 }}
          value={mapaContext.playStatus}
          onChange={(e, i) => {
            if (!intervalId && i > 0) {
              setReproduzindo(true);
              handleIntervaloAtualizaTempo();
              const idInterval = setInterval(
                handleIntervaloAtualizaTempo,
                1000
              );
              setIntervalId(idInterval);
            } else {
              if (typeof i === "string")
                dispatch({
                  type: "pulaTempo",
                  valorPropriedade: i === "volta" ? -1 : 1,
                });
              else {
                setReproduzindo(false);
                clearInterval(intervalId);
                setIntervalId(null);
              }
            }
          }}
        >
          <BottomNavigationAction
            label="Anterior"
            icon={<SkipPrevious />}
            value={"volta"}
          />
          {!reproduzindo ? (
            <BottomNavigationAction
              label="Play"
              icon={<PlayArrow />}
              value={1}
            />
          ) : (
            <BottomNavigationAction label="Pause" icon={<Pause />} value={-1} />
          )}
          <BottomNavigationAction
            label="Proximo"
            icon={<SkipNext />}
            value={"avanca"}
          />
        </BottomNavigation>
      )}
      {!isApresentacao && (
        <>
          {" "}
          <BottomNavigation
            sx={{ minWidth: 230 }}
            onChange={(e, i) => {
              if (i == 2) {
                clearInterval(intervalId);
                setIntervalId(null);
                dispatch({
                  type: "selecionarElementoFoco",
                });
                setTimeout(() => {
                  dispatch({
                    type: "alteraPropriedadeGeral",
                    nomePropriedade: "playStatus",
                    valorPropriedade: i,
                  });
                }, 100);
              } else {
                dispatch({
                  type: "pulaTempo",
                  valorPropriedade: i,
                });
              }
            }}
          >
            <BottomNavigationAction
              label="Anterior"
              icon={<SkipPrevious />}
              value={-1}
            />
            <BottomNavigationAction
              label="Apresentação"
              icon={<DesktopWindows />}
              value={2}
            />
            <BottomNavigationAction
              label="Proximo"
              icon={<SkipNext />}
              value={1}
            />
          </BottomNavigation>
          <BottomNavigation
            sx={{ minWidth: 230 }}
            value={mapaContext.playStatus}
            onChange={(e, i) => {
              dispatch({
                type: "alteraPropriedadeGeral",
                nomePropriedade: "playStatus",
                valorPropriedade: i,
              });

              if (!intervalId && i > 0) {
                handleIntervaloAtualizaTempo();
                const idInterval = setInterval(
                  handleIntervaloAtualizaTempo,
                  1000
                );
                setIntervalId(idInterval);
              } else {
                clearInterval(intervalId);
                setIntervalId(null);
                const newValue = i
                  ? tempoAtual.current
                  : mapaContext.conteudo.cenas[0].cenaInicio;
                if (tempoAtualRef) tempoAtualRef.current = newValue;
                dispatch({
                  type: "atualizaTempo",
                  time: tempoAtualRef ? tempoAtualRef.current : newValue,
                });
              }
            }}
          >
            <BottomNavigationAction
              label="Play"
              icon={<PlayArrow />}
              disabled={mapaContext.playStatus > 0}
              value={1}
            />
            <BottomNavigationAction
              label="Pause"
              icon={<Pause />}
              disabled={mapaContext.playStatus < 1}
              value={-1}
            />
            <BottomNavigationAction
              label="Stop"
              icon={<Stop />}
              disabled={mapaContext.playStatus === 0}
              value={0}
            />
          </BottomNavigation>{" "}
        </>
      )}
    </Paper>
  );
};

export default ReprodutorLinhaTempo;
