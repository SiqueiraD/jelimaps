import moment from "moment";
import { v4 } from "uuid";
import { DateType } from "vis-timeline";
import contextChangers from ".";
import {
    actionContextChange,
    elementoPadrao,
    mapaContextSchema,
} from "./../mapaContextTypes";
import auxiliadorRetornoContext from "./auxiliadorRetornoContext";

function getRandomColor(oldMapaContext: mapaContextSchema) {
  var letters = "0123456789ABCDEF";
  var color = "#";
  for (var i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  const cenafim =
    oldMapaContext.conteudo.cenas[oldMapaContext.conteudo.cenas.length - 1];
  if (!similarColors(cenafim.color, color)) return hexToRGBA(color, 0.8);
  else return getRandomColor(oldMapaContext);
}
function hexToRGBA(hex, alpha) {
  var r = parseInt(hex.slice(1, 3), 16),
    g = parseInt(hex.slice(3, 5), 16),
    b = parseInt(hex.slice(5, 7), 16);

  if (alpha) {
    return "rgba(" + r + ", " + g + ", " + b + ", " + alpha + ")";
  } else {
    return "rgb(" + r + ", " + g + ", " + b + ")";
  }
}

// Função para calcular a distância euclidiana entre dois pontos
function distance(x1, y1, x2, y2) {
  return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
}

// Função para converter uma cor hexadecimal em HSV
function hexToHSV(color) {
  // Converte a cor hexadecimal em RGB
  var r = parseInt(color.slice(1, 3), 16) / 255;
  var g = parseInt(color.slice(3, 5), 16) / 255;
  var b = parseInt(color.slice(5, 7), 16) / 255;
  // Calcula o máximo, o mínimo e a diferença entre os valores RGB
  var max = Math.max(r, g, b);
  var min = Math.min(r, g, b);
  var diff = max - min;
  // Variáveis para armazenar os valores HSV
  var h, s, v;
  // Calcula o valor de H
  if (max == min) {
    h = 0;
  } else if (max == r) {
    h = ((60 * (g - b)) / diff + 360) % 360;
  } else if (max == g) {
    h = ((60 * (b - r)) / diff + 120) % 360;
  } else if (max == b) {
    h = ((60 * (r - g)) / diff + 240) % 360;
  }
  // Calcula o valor de S
  if (max == 0) {
    s = 0;
  } else {
    s = diff / max;
  }
  // Calcula o valor de V
  v = max;
  // Retorna um objeto com os valores HSV
  return { h: h, s: s, v: v };
}

// Função para verificar se duas cores são parecidas, ou do mesmo tom
function similarColors(color1, color2) {
  // Converte as cores hexadecimais em HSV
  var hsv1 = hexToHSV(color1);
  var hsv2 = hexToHSV(color2);
  // Calcula a distância entre as cores no espaço HSV
  var d = distance(hsv1.h, hsv1.s, hsv2.h, hsv2.s);
  // Define um limiar de similaridade
  var threshold = 10;
  // Retorna verdadeiro se a distância for menor que o limiar, falso caso contrário
  return d < threshold;
}

const novaCena = (oldMapaContext: mapaContextSchema) => {
  const cenafim = moment(
    oldMapaContext.conteudo.cenas[oldMapaContext.conteudo.cenas.length - 1]
      .cenaFim
  );
  const cenainicio = moment(
    oldMapaContext.conteudo.cenas[oldMapaContext.conteudo.cenas.length - 1]
      .cenaInicio
  );
  const diffCen = cenafim.diff(cenainicio, "seconds");
  return {
    id: v4(),
    cenaInicio: cenafim.format("yyyy-MM-DDTHH:mm:ss"),
    cenaFim: cenafim.add(diffCen, "seconds").format("yyyy-MM-DDTHH:mm:ss"),
    nome: `cena #${oldMapaContext.conteudo.cenas.length + 1}`,
    dataRef: "cenas",
    color: getRandomColor(oldMapaContext),
    // style: `background-color: ${getRandomColor(oldMapaContext)}`,
    visTimelineObject: { type: "background" },
  } as elementoPadrao;
};

const adicionarNovaCena = (
  oldMapaContext: mapaContextSchema
): mapaContextSchema => {
  const novaCenaObj = novaCena(oldMapaContext);
  if (oldMapaContext.timelineMode === "simple")
    return contextChangers.addSimpleScene(oldMapaContext, novaCenaObj);
  return {
    ...oldMapaContext,
    cenaFim: novaCenaObj.cenaFim,
    conteudo: {
      ...oldMapaContext.conteudo,
      cenas: [...oldMapaContext.conteudo.cenas, novaCenaObj],
    },
  };
};

const deletarCena = (
  oldMapaContext: mapaContextSchema,
  actionContextChange: actionContextChange
): mapaContextSchema => {
  if (oldMapaContext.timelineMode === "simple")
    return contextChangers.deleteSimpleScene(oldMapaContext, actionContextChange);
  const novasCenas = oldMapaContext.conteudo.cenas.filter(
    (x) => x.id !== actionContextChange.id
  );
  return {
    ...oldMapaContext,
    conteudo: { ...oldMapaContext.conteudo, cenas: novasCenas },
  };
};

const changePropriedadeCena = (
  oldMapaContext: mapaContextSchema,
  actionContextChange: actionContextChange
): mapaContextSchema => {
  //return MapaContextChanger.movendoImagem(oldMapaContext, action);
  if (!actionContextChange.formik.isValid) return oldMapaContext;
  if (actionContextChange.tipo.includes("cena"))
    if (actionContextChange.tipo === "cenaInicio") {
      oldMapaContext.conteudo.cenas[actionContextChange.indiceElemento][
        actionContextChange.tipo
      ] = actionContextChange.valor;
      if (actionContextChange.indiceElemento > 0)
        oldMapaContext.conteudo.cenas[
          actionContextChange.indiceElemento - 1
        ].cenaFim = actionContextChange.valor;
    } else if (actionContextChange.tipo === "cenaFim") {
      oldMapaContext.conteudo.cenas[actionContextChange.indiceElemento][
        actionContextChange.tipo
      ] = actionContextChange.valor;
      if (
        actionContextChange.indiceElemento <
        oldMapaContext.conteudo.cenas.length - 2
      )
        oldMapaContext.conteudo.cenas[
          actionContextChange.indiceElemento + 1
        ].cenaInicio = actionContextChange.valor;
    } else
      oldMapaContext.conteudo.cenas[actionContextChange.indiceElemento][
        actionContextChange.tipo
      ] = actionContextChange.valor;
  else
    oldMapaContext.conteudo.cenas[actionContextChange.indiceElemento][
      actionContextChange.tipo
    ] = actionContextChange.valor;
  return { ...oldMapaContext };
};

const fixarCena = (
  oldMapaContext: mapaContextSchema,
  actionContextChange: actionContextChange
): mapaContextSchema => {
  const ctent = oldMapaContext.conteudo.cenas.find(
    (x) => x.id === actionContextChange.id
  );
  ctent.center = oldMapaContext.center;
  ctent.zoom = oldMapaContext.zoom;
  ctent.bounds = oldMapaContext.bounds;
  return {
    ...oldMapaContext,
  };
};

function getClosestDateIndex(dateList: DateType[], targetDate: DateType) {
  var closestDateIndex = 0;
  var closestDateDiff = Math.abs(
    new Date(dateList[0]).getTime() - new Date(targetDate).getTime()
  );

  for (var i = 1; i < dateList.length; i++) {
    var diff = Math.abs(
      new Date(dateList[i]).getTime() - new Date(targetDate).getTime()
    );
    if (diff < closestDateDiff) {
      closestDateDiff = diff;
      closestDateIndex = i;
    }
  }

  return closestDateIndex;
}

const pulaTempoCenaOuAlteracaoConteudo = (
  oldMapaContext: mapaContextSchema,
  actionContextChange: actionContextChange
) => {
  const temposOrdenados = auxiliadorRetornoContext
    .retornaListaTemposConteudo(oldMapaContext)
    .sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
  const indiceElemento = getClosestDateIndex(
    temposOrdenados,
    oldMapaContext.tempo
  );
  return {
    ...oldMapaContext,
    tempo:
      temposOrdenados[
        indiceElemento + (actionContextChange.valorPropriedade > 0 ? 1 : -1)
      ],
  };
};

const selecionarCena = (
  oldMapaContext: mapaContextSchema,
  actionContextChange: actionContextChange
): mapaContextSchema => {
  oldMapaContext.conteudo.cenas = oldMapaContext.conteudo.cenas.map((x) => {
    return { ...x, properties: { ...x.properties, selected: null } };
  });
  oldMapaContext = contextChangers.editarPropriedadeElemento(
    oldMapaContext,
    actionContextChange
  );
  return {
    ...oldMapaContext,
  };
};

const cenaContextChanger = {
  fixarCena,
  deletarCena,
  selecionarCena,
  adicionarNovaCena,
  changePropriedadeCena,
  pulaTempoCenaOuAlteracaoConteudo,
};
export default cenaContextChanger;
