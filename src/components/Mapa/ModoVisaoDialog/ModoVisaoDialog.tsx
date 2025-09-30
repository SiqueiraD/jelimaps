import React, { useCallback, useEffect } from "react";
import {
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Typography,
  styled,
  Button as ButtonMUI,
  ListItem,
  List,
} from "@mui/material";
import {
  useMapaContext,
  useMapaDispatch,
  useMapaUndo,
} from "@/components/Mapa/MapaContext";
import useCaixaDialogo from "@/components/CaixaDialogo/useCaixaDialogo";
import ImageResolver from "@/components/ImageUrlResolver";
import Button from "@/components/Atomic/Button";
import useWindowDimensions from "@/components/Studio/useWindowDimensions";
import Image from "next/image";

const VisuallyHiddenInput = styled("input")({
  clip: "rect(0 0 0 0)",
  clipPath: "inset(50%)",
  height: 1,
  overflow: "hidden",
  position: "absolute",
  bottom: 0,
  left: 0,
  whiteSpace: "nowrap",
  width: 1,
});

export default function ModoVisaoDialog() {
  const { openModalConfirm, closeModalConfirm, onConfirm, open } =
    useCaixaDialogo();
  const mapaContext = useMapaContext();
  const dispatch = useMapaDispatch();
  const nameRef = React.useRef("");
  const { reset } = useMapaUndo();
  const { width, height } = useWindowDimensions();

  const handleOpenStreetMap = useCallback(() => {
    dispatch({
      type: "modoVisao",
      modoVisao: "OpenStreetMap",
    });
    closeModalConfirm(null, null);
  }, [closeModalConfirm, dispatch]);

  const handleMapaProprioComImagem = useCallback(async () => {
    dispatch({
      type: "modoVisao",
      modoVisao: "Mapa Próprio",
      valor: await ImageResolver.UrlResolver(nameRef.current),
    });
    closeModalConfirm(null, null);
  }, [closeModalConfirm, dispatch]);

  const handleMapaProprio = useCallback(async () => {
    const isImagemValida = await ImageResolver.isValidUrl(nameRef.current);
    const urlImagem = await ImageResolver.UrlResolver(nameRef.current);
    openModalConfirm({
      title: "",
      message: "",
      onConfirm,
      cancelarNotVisible: true,
      confirmarNotVisible: true,
      fecharApenasComEvento: true,
      componentMessage: (
        <div>
          <DialogTitle>
            Por favor, insira a url da imagem do seu mapa!
          </DialogTitle>
          <DialogContent dividers>
            <TextField
              id="outlined-controlled"
              label="Link da Imagem"
              onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                nameRef.current = event.target.value;
              }}
            />
            {nameRef.current && nameRef.current !== "" && isImagemValida ? (
              <Image
                alt="MapaProprio"
                src={urlImagem}
                width={width * 0.21}
                height={height * 0.21}
                placeholder="blur"
                blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=="
              />
            ) : (
              <div> Copie um link válido</div>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={handleMapaProprio}>Atualizar</Button>
            {nameRef.current && nameRef.current !== "" && isImagemValida && (
              <Button onClick={handleMapaProprioComImagem}>Salvar</Button>
            )}
          </DialogActions>
        </div>
      ),
    });
  }, [openModalConfirm, onConfirm, width, height, handleMapaProprioComImagem]);

  useEffect(() => {
    if (!!mapaContext.modoVisao && open) {
      closeModalConfirm(null, null);
    }
    if (!mapaContext.modoVisao) {
      openModalConfirm({
        title: "",
        message: "",
        onConfirm,
        cancelarNotVisible: true,
        confirmarNotVisible: true,
        fecharApenasComEvento: true,
        componentMessage: (
          <div>
            <DialogTitle>
              Olá, aventureiro do mapa! 🗺️ Está pronto para começar sua jornada
              de conhecimento ou continuar um projeto já iniciado? Aqui estão
              suas opções:
            </DialogTitle>
            <List>
              <ListItem>
                <Typography gutterBottom>
                  Explorar Terras Conhecidas (<b>Mapas Comuns</b>): Escolha esta
                  opção se você quer utilizar mapas incríveis do Openstreetmap e
                  outros estilos de mapas públicos. É como ter um mapa do mundo
                  inteiro na ponta dos seus dedos!
                </Typography>
              </ListItem>
              <ListItem>
                <Typography gutterBottom>
                  Criar Meu Próprio Mundo (<b>Mapa Próprio</b>): Se você tem uma
                  imagem especial que quer usar como mapa, esta é a sua escolha!
                  Envie sua imagem e transforme-a no cenário da sua próxima
                  grande história.
                </Typography>
              </ListItem>
              <ListItem>
                <Typography gutterBottom>
                  Seguir o Caminho (<b>Continuar Projeto</b>): Já começou uma
                  narrativa e quer seguir em frente? Selecione esta opção para
                  carregar seu arquivo de projeto e retomar sua missão de onde
                  parou.
                </Typography>
              </ListItem>
            </List>
            {/* <DialogContent dividers>
              <Typography gutterBottom>
                Explorar Terras Conhecidas (Openstreetmap): Escolha esta opção
                se você quer utilizar mapas incríveis do Openstreetmap e outros
                estilos de mapas públicos. É como ter um mapa do mundo inteiro
                na ponta dos seus dedos!
              </Typography>
              <Typography gutterBottom>
                Criar Meu Próprio Mundo (Mapa Próprio): Se você tem uma imagem
                especial que quer usar como mapa, esta é a sua escolha! Envie
                sua imagem e transforme-a no cenário da sua próxima grande
                história.
              </Typography>
              <Typography gutterBottom>
                Seguir o Caminho (Continuar Projeto): Já começou uma narrativa e
                quer seguir em frente? Selecione esta opção para carregar seu
                arquivo de projeto e retomar sua missão de onde parou.
              </Typography>

              <div id="resultado">
                Escolha com sabedoria e boa sorte em sua jornada!
              </div>
            </DialogContent> */}
            <DialogActions>
              <ButtonMUI variant="contained" onClick={handleOpenStreetMap}>
                Mapas Comuns
              </ButtonMUI>
              <ButtonMUI variant="contained" onClick={handleMapaProprio}>
                Mapa Próprio
              </ButtonMUI>
              <ButtonMUI variant="contained" sx={{ mx: 1 }} component="label">
                Continuar projeto
                <VisuallyHiddenInput
                  type="file"
                  onChange={(e) => {
                    var arquivo = e.target.files[0];

                    // Verificar se o arquivo tem a extensão .griot
                    if (arquivo.name.endsWith(".griot")) {
                      // Criar um objeto FileReader para ler o arquivo
                      var leitor = new FileReader();

                      // Definir uma função que é chamada quando o arquivo é lido
                      leitor.onload = function (e) {
                        // Obter o conteúdo do arquivo como uma string

                        // Tentar converter o texto em um objeto JSON
                        try {
                          const texto = e.target.result as string;
                          var json = JSON.parse(texto);

                          // Mostrar o JSON na tela
                          reset(json);
                          document.getElementById("resultado").innerHTML =
                            JSON.stringify(json, null, 2);
                          closeModalConfirm(null, null);
                        } catch (erro) {
                          // Mostrar o erro na tela
                          document.getElementById("resultado").innerHTML =
                            "Erro ao converter o texto em JSON: " +
                            erro.message;
                        }
                      };

                      // Ler o arquivo como uma string
                      leitor.readAsText(arquivo);
                    } else {
                      // Mostrar uma mensagem de erro na tela
                      document.getElementById("resultado").innerHTML =
                        "O arquivo selecionado não tem a extensão .griot";
                    }
                  }}
                />
              </ButtonMUI>
            </DialogActions>
          </div>
        ),
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapaContext.modoVisao]);
  return null;
}
