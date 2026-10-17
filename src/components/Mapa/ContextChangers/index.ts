import auxiliadorRetornoContext from "./auxiliadorRetornoContext";
import cenaContextChanger from "./cenaContextChanger";
import conteudoContextChanger from "./conteudoContextChanger";
import focoInteracaoContextChanger from "./focoInteracaoContextChanger";
import simpleTimelineContextChanger from "./simpleTimelineContextChanger";

const contextChangers = {
  ...cenaContextChanger,
  ...conteudoContextChanger,
  ...auxiliadorRetornoContext,
  ...focoInteracaoContextChanger,
  ...simpleTimelineContextChanger,
};

export default contextChangers;
