import Button from '@/components/Atomic/Button';
import ImageUploadField from '@/components/Atomic/ImageUploadField';
import useCaixaDialogo from '@/components/CaixaDialogo/useCaixaDialogo';
import ImageResolver from '@/components/ImageUrlResolver';
import {
  useMapaContext,
  useMapaDispatch,
  useMapaUndo,
} from '@/components/Mapa/MapaContext';
import useWindowDimensions from '@/components/Studio/useWindowDimensions';
import { useMapaStore } from '@/stores/mapaStore';
import {
  Button as ButtonMUI,
  DialogActions,
  DialogContent,
  DialogTitle,
  List,
  ListItem,
  TextField,
  Typography,
  styled,
} from '@mui/material';
import { useSession } from 'next-auth/react';
import React, { useCallback, useEffect } from 'react';

const VisuallyHiddenInput = styled('input')({
  clip: 'rect(0 0 0 0)',
  clipPath: 'inset(50%)',
  height: 1,
  overflow: 'hidden',
  position: 'absolute',
  bottom: 0,
  left: 0,
  whiteSpace: 'nowrap',
  width: 1,
});

export default function ModoVisaoDialog() {
  const { openModalConfirm, closeModalConfirm, onConfirm, open } =
    useCaixaDialogo();
  const mapaContext = useMapaContext();
  const { mapaId, tituloMapa, setStore } = useMapaStore();
  const { status } = useSession();
  const isAuthenticated = status === 'authenticated';
  const dispatch = useMapaDispatch();
  const imageUrlRef = React.useRef('');
  const { reset } = useMapaUndo();
  const { width, height } = useWindowDimensions();

  // Abre o dialog de imagem para Mapa Próprio. Chama dispatch modoVisao ao salvar.
  const abrirDialogImagem = useCallback(
    (idAtual: string | null) => {
      imageUrlRef.current = '';
      openModalConfirm({
        title: '',
        message: '',
        onConfirm: () => {},
        cancelarNotVisible: true,
        confirmarNotVisible: true,
        fecharApenasComEvento: true,
        componentMessage: (
          <div>
            <DialogTitle>
              Por favor, insira a url da imagem do seu mapa!
            </DialogTitle>
            <DialogContent dividers>
              <ImageUploadField
                defaultValue=""
                onChange={(url) => {
                  imageUrlRef.current = url;
                }}
                mapaId={idAtual}
                previewWidth={Math.round(width * 0.21)}
                previewHeight={Math.round(height * 0.21)}
              />
            </DialogContent>
            <DialogActions>
              <Button
                onClick={async () => {
                  const urlResolvida = await ImageResolver.UrlResolver(
                    imageUrlRef.current
                  );
                  dispatch({
                    type: 'modoVisao',
                    modoVisao: 'Mapa Próprio',
                    valor: urlResolvida,
                  });
                  closeModalConfirm(null, null);
                }}
              >
                Salvar
              </Button>
            </DialogActions>
          </div>
        ),
      });
    },
    [openModalConfirm, closeModalConfirm, dispatch, width, height]
  );

  const salvarEContinuar = useCallback(
    async (titulo: string, onCriado: (id: string) => void) => {
      try {
        const res = await fetch('/api/mapas', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            titulo,
            informacoes: mapaContext,
            publico: false,
          }),
        });
        if (res.ok) {
          const { id } = await res.json();
          setStore(
            { mapaId: id, tituloMapa: titulo },
            { syncSavedVersion: true }
          );
          dispatch({
            type: 'alteraPropriedadeGeral',
            nomePropriedade: 'id',
            valorPropriedade: id,
          });
          onCriado(id);
          window.history.replaceState(null, '', `/mapa/${id}`);
        }
      } catch {
        // falha silenciosa
      }
    },
    [mapaContext, setStore, dispatch]
  );

  const pedirTituloESalvar = useCallback(
    (onCriado: (id: string) => void) => {
      const tituloRef = { current: tituloMapa || '' };
      openModalConfirm({
        title: 'Qual é o nome do seu mapa?',
        message: '',
        componentMessage: (
          <TextField
            label="Título do mapa"
            defaultValue={tituloRef.current}
            onChange={(e) => {
              tituloRef.current = e.target.value;
            }}
            fullWidth
            autoFocus
            margin="dense"
          />
        ),
        confirmarTitle: 'Criar mapa',
        onConfirm: async () => {
          const titulo = tituloRef.current.trim() || 'Mapa sem título';
          await salvarEContinuar(titulo, onCriado);
        },
      });
    },
    [openModalConfirm, tituloMapa, salvarEContinuar]
  );

  const handleOpenStreetMap = useCallback(() => {
    closeModalConfirm(null, null);
    if (mapaId) {
      dispatch({ type: 'modoVisao', modoVisao: 'OpenStreetMap' });
    } else if (isAuthenticated) {
      pedirTituloESalvar(() => {
        dispatch({ type: 'modoVisao', modoVisao: 'OpenStreetMap' });
      });
    } else {
      dispatch({ type: 'modoVisao', modoVisao: 'OpenStreetMap' });
    }
  }, [
    closeModalConfirm,
    dispatch,
    mapaId,
    isAuthenticated,
    pedirTituloESalvar,
  ]);

  const handleMapaProprio = useCallback(() => {
    closeModalConfirm(null, null);
    if (mapaId) {
      abrirDialogImagem(mapaId);
    } else if (isAuthenticated) {
      pedirTituloESalvar((id) => {
        abrirDialogImagem(id);
      });
    } else {
      abrirDialogImagem(null);
    }
  }, [
    closeModalConfirm,
    mapaId,
    isAuthenticated,
    pedirTituloESalvar,
    abrirDialogImagem,
  ]);

  useEffect(() => {
    if (!!mapaContext.modoVisao && open) {
      closeModalConfirm(null, null);
    }
    if (!mapaContext.modoVisao) {
      openModalConfirm({
        title: '',
        message: '',
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
                    if (arquivo.name.endsWith('.griot')) {
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
                          document.getElementById('resultado').innerHTML =
                            JSON.stringify(json, null, 2);
                          closeModalConfirm(null, null);
                        } catch (erro) {
                          // Mostrar o erro na tela
                          document.getElementById('resultado').innerHTML =
                            'Erro ao converter o texto em JSON: ' +
                            erro.message;
                        }
                      };

                      // Ler o arquivo como uma string
                      leitor.readAsText(arquivo);
                    } else {
                      // Mostrar uma mensagem de erro na tela
                      document.getElementById('resultado').innerHTML =
                        'O arquivo selecionado não tem a extensão .griot';
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
