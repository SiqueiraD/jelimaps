import moment from "moment";
import { actionContextChange, mapaContextSchema } from "./mapaContextTypes";
import MapaFunctionHelpers from "./MapaFunctionsHelpers";

export function mapaReducer(
  oldMapaContext: mapaContextSchema,
  action: actionContextChange
): mapaContextSchema {
  console.log(
    `metodoDispatch [TYPE:${action.type}] disparado`,
    oldMapaContext,
    action
  );
  switch (action.type) {
    case "modoVisao": {
      return { ...oldMapaContext, modoVisao: action.tipo };
    }
    case "alteraPropriedadesMapa": {
      return {
        ...oldMapaContext,
        center: action.map?.getCenter(),
        zoom: action.map?.getZoom(),
        bounds: action.map?.getBounds(),
      };
    }
    case "selecionarElementoInteracao": {
      return MapaFunctionHelpers.changeElementoInteracao(
        oldMapaContext,
        action.arg
      );
    }
    case "adicionarElementoFoco": {
      return MapaFunctionHelpers.changeElementosFoco(oldMapaContext, action);
    }
    case "adicionarAlteracaoElemento": {
      return MapaFunctionHelpers.addAlteracaoElemento(oldMapaContext, action);
    }
    case "selecionarElementosFoco": {
      return MapaFunctionHelpers.changeTodosElementosFoco(
        oldMapaContext,
        action
      );
    }
    case "selecionarElementoFoco": {
      return MapaFunctionHelpers.changeElementoFoco(oldMapaContext, action);
    }
    case "selecionarElementosFocoPorId": {
      return MapaFunctionHelpers.changeTodosElementosFocoPorIds(
        oldMapaContext,
        action
      );
    }
    case "desativarElementos": {
      return MapaFunctionHelpers.changeElementoInteracao(oldMapaContext, null);
    }
    case "addMarker": {
      return MapaFunctionHelpers.addElementoMarker(oldMapaContext, action);
    }
    case "addPolyline": {
      return MapaFunctionHelpers.addElementoPolyline(oldMapaContext, action);
    }
    case "addPolygon": {
      return MapaFunctionHelpers.addElementoPolygon(oldMapaContext, action);
    }
    case "addCircle": {
      return MapaFunctionHelpers.addElementoCirculo(oldMapaContext, action);
    }
    // case "addRectangle": {
    //   return MapaFunctionHelpers.addElementoQuadrilatero(
    //     oldMapaContext,
    //     action
    //   );
    // }
    case "propriedadeToggle": {
      return {
        ...oldMapaContext,
        slidePropriedade: !oldMapaContext.slidePropriedade,
      };
    }
    case "removeElements": {
      return MapaFunctionHelpers.removeElemento(oldMapaContext, action);
    }
    case "updateTimelineElement": {
      return MapaFunctionHelpers.atualizaLinhaTempoElemento(
        oldMapaContext,
        action
      );
    }
    case "editarPropriedade": {
      return MapaFunctionHelpers.editarPropriedadeElemento(
        oldMapaContext,
        action.tipo,
        action.id,
        action.nomePropriedade,
        action.valorPropriedade
      );
    }
    case "trocaMapaContext": {
      return {
        ...(action.mapContext ?? oldMapaContext),
      };
    }
    case "atualizaTempo": {
      const novoTempo = action.time ?? oldMapaContext.tempo;
      const cenaNova = oldMapaContext.conteudo.cenas.find(
        (x) =>
          moment(x.cenaInicio) <= moment(novoTempo) &&
          moment(x.cenaFim) >= moment(novoTempo) &&
          (moment(x.cenaInicio) > moment(oldMapaContext.tempo) ||
            moment(x.cenaFim) < moment(oldMapaContext.tempo))
      );
      if (cenaNova) {
        oldMapaContext.center = cenaNova.center;
        oldMapaContext.zoom = cenaNova.zoom;
        oldMapaContext.bounds = cenaNova.bounds;
      }
      return { ...oldMapaContext, tempo: novoTempo };
    }
    case "alteraPropriedadeGeral": {
      if (action.tipo.includes("cena")) {
        if (!action.formik.isValid) return oldMapaContext;
        if (action.tipo === "cenaInicio")
          oldMapaContext.conteudo.cenas[0].cenaInicio = action.valor;
        if (action.tipo === "cenaFim")
          oldMapaContext.conteudo.cenas[
            oldMapaContext.conteudo.cenas.length - 1
          ].cenaFim = action.valor;
      }
      return { ...oldMapaContext, [action.tipo]: action.valor };
    }
    case "alteraPropriedadeTimelineOptions": {
      if (action.tipo === "showCurrentTime")
        if (action.valor) oldMapaContext.tempo = oldMapaContext.cenaInicio;
      return {
        ...oldMapaContext,
        timelineOptions: {
          ...oldMapaContext.timelineOptions,
          [action.tipo]: action.valor,
        },
      };
    }
    case "inserindoNovaCena": {
      const novaCena = MapaFunctionHelpers.novaCena(oldMapaContext);
      oldMapaContext.conteudo.cenas.push(novaCena);
      return {
        ...oldMapaContext,
        cenaFim: novaCena.cenaFim,
      };
    }
    case "alteraPropriedadeCena": {
      if (!action.formik.isValid) return oldMapaContext;
      if (action.tipo.includes("cena"))
        if (action.tipo === "cenaInicio") {
          oldMapaContext.conteudo.cenas[action.indiceElemento][action.tipo] =
            action.valor;
          if (action.indiceElemento > 0)
            oldMapaContext.conteudo.cenas[action.indiceElemento - 1].cenaFim =
              action.valor;
        } else if (action.tipo === "cenaFim") {
          oldMapaContext.conteudo.cenas[action.indiceElemento][action.tipo] =
            action.valor;
          if (action.indiceElemento < oldMapaContext.conteudo.cenas.length - 2)
            oldMapaContext.conteudo.cenas[
              action.indiceElemento + 1
            ].cenaInicio = action.valor;
        } else
          oldMapaContext.conteudo.cenas[action.indiceElemento][action.tipo] =
            action.valor;
      else
        oldMapaContext.conteudo.cenas[action.indiceElemento][action.tipo] =
          action.valor;
      return { ...oldMapaContext };
    }
    case "fixarCena": {
      const ctent = oldMapaContext.conteudo.cenas.find(
        (x) => x.id === action.id
      );
      ctent.center = oldMapaContext.center;
      ctent.zoom = oldMapaContext.zoom;
      ctent.bounds = oldMapaContext.bounds;
      return {
        ...oldMapaContext,
      };
    }
    default: {
      throw Error("Unknown action: " + action.type);
    }
  }
}
