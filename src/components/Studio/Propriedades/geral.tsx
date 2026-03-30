import useBarraAlerta from '@/components/BarraAlerta/useBarraAlerta';
import useCaixaDialogo from '@/components/CaixaDialogo/useCaixaDialogo';
import {
  useMapaContext,
  useMapaDispatch,
  useMapaUndo,
} from '@/components/Mapa/MapaContext';
import { MODO_VISAO } from '@/components/Mapa/mapaContextTypes';
import tiposPlanoFundo from '@/components/Mapa/PlanoFundoMapaComum/tiposPlanoFundo';
import { useMapaStore } from '@/stores/mapaStore';
import {
  Alert,
  Button,
  ButtonGroup,
  Container,
  FormControl,
  FormControlLabel,
  FormLabel,
  InputLabel,
  MenuItem,
  Radio,
  RadioGroup,
  Select,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import { Form, Formik } from 'formik';
import moment from 'moment';
import { signIn, useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import * as Yup from 'yup';
import ListaElementos from './ListaElementos';
import PainelCompartilhamento from './PainelCompartilhamento';

export default function Geral() {
  const mapaContext = useMapaContext();
  const { reset } = useMapaUndo();
  const dispatch = useMapaDispatch();
  const { openModalConfirm } = useCaixaDialogo();
  const router = useRouter();
  const { status } = useSession();
  const { mapaId, tituloMapa, setStore, contextVersion, savedContextVersion } =
    useMapaStore();
  const tituloAtual = mapaContext.titulo ?? tituloMapa;
  const hasUnsavedChanges = !mapaId || contextVersion !== savedContextVersion;
  const barraAlerta = useBarraAlerta();
  const handleSalvar = () => {
    openModalConfirm({
      title: 'Salvar mapa',
      message: mapaId
        ? 'O mapa será atualizado, inclusive a versão compartilhada com todos os visualizadores.'
        : 'O mapa será salvo e ficará disponível em Meus Mapas.',
      confirmarTitle: 'Salvar',
      onConfirm: async () => {
        const titulo = tituloAtual?.trim() || 'Mapa sem título';
        try {
          if (mapaId) {
            const res = await fetch(`/api/mapas/${mapaId}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ titulo, informacoes: mapaContext }),
            });
            if (!res.ok) throw new Error((await res.json()).error);
            setStore(
              { mapaId, tituloMapa: titulo },
              { syncSavedVersion: true }
            );
          } else {
            const res = await fetch('/api/mapas', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                titulo,
                informacoes: mapaContext,
                publico: false,
              }),
            });
            if (!res.ok) throw new Error((await res.json()).error);
            const { id } = await res.json();
            setStore(
              { mapaId: id, tituloMapa: titulo },
              { syncSavedVersion: true }
            );
          }
          barraAlerta.showSnackBar({
            text: 'Mapa salvo com sucesso!',
            color: 'success',
          });
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : 'Erro ao salvar';
          barraAlerta.showSnackBar({ text: msg, color: 'error' });
        }
      },
    });
  };

  return (
    <>
      <Formik
        initialValues={mapaContext}
        onSubmit={() => console.log('submtou')}
        validateOnBlur={true}
        validationSchema={Yup.object({
          cenaInicio: Yup.date().max(
            mapaContext.conteudo.cenas[0].cenaFim,
            'O inicio deve ser menor que o final da primeira cena.'
          ),
          cenaFim: Yup.date().min(
            mapaContext.conteudo.cenas[mapaContext.conteudo.cenas.length - 1]
              .cenaInicio,
            'O final deve ser maior que o inicio da ultima cena.'
          ),
        })}
      >
        {(formik) => {
          return (
            <Form
              onBlur={(e: any) => {
                if (!!e.target.name && !!e.target.value)
                  dispatch({
                    type: 'alteraPropriedadeGeral',
                    nomePropriedade: e.target.name,
                    valorPropriedade: e.target.value,
                    formik: formik,
                  });
              }}
            >
              <ButtonGroup
                variant="outlined"
                aria-label="outlined button group"
              >
                <Button onClick={() => router.push('/')}>Sair</Button>
                <Button
                  onClick={() => {
                    openModalConfirm({
                      title: 'Começar um novo',
                      message:
                        'Vai perder todas alterações feitas, tem certeza disso?',
                      onConfirm: () => {
                        reset();
                      },
                    });
                  }}
                >
                  Resetar
                </Button>
                {status === 'authenticated' && (
                  <Button
                    onClick={handleSalvar}
                    color="primary"
                    variant="contained"
                    disabled={!hasUnsavedChanges}
                  >
                    Salvar
                  </Button>
                )}
                {/* <Button component="label">
                Importar
                <VisuallyHiddenInput type="file" />
              </Button> */}
                <Button
                  onClick={() => {
                    const conteudo = JSON.stringify({
                      ...mapaContext,
                      titulo: tituloAtual,
                    });
                    const blob = new Blob([conteudo], { type: 'text/plain' });
                    var url = URL.createObjectURL(blob);
                    var a = document.createElement('a');
                    a.href = url;
                    a.download = `${tituloAtual?.trim() || 'arquivo'}.griot`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                  }}
                >
                  Exportar
                </Button>
              </ButtonGroup>

              {status !== 'authenticated' && (
                <Alert
                  severity="info"
                  sx={{ mb: 1 }}
                  action={
                    <Button
                      color="inherit"
                      size="small"
                      onClick={() => signIn('google')}
                    >
                      Entrar / Cadastrar
                    </Button>
                  }
                >
                  Entre ou cadastre-se para salvar online e fazer upload de
                  imagens.
                </Alert>
              )}

              <Container className="group-frame">
                <Typography variant="h6" className="title">
                  Mapa
                </Typography>
                <TextField
                  label="Título do mapa"
                  value={tituloAtual}
                  onChange={(e) => {
                    dispatch({
                      type: 'alteraPropriedadeGeral',
                      nomePropriedade: 'titulo',
                      valorPropriedade: e.target.value,
                    });
                  }}
                  onBlur={async (e) => {
                    const novoTitulo =
                      e.target.value?.trim() || 'Mapa sem título';
                    if (!mapaId) return;
                    if (novoTitulo !== tituloAtual) {
                      try {
                        const res = await fetch(`/api/mapas/${mapaId}`, {
                          method: 'PUT',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            titulo: novoTitulo,
                            informacoes: mapaContext,
                          }),
                        });
                        if (!res.ok) throw new Error((await res.json()).error);
                        setStore(
                          { mapaId, tituloMapa: novoTitulo },
                          { syncSavedVersion: true }
                        );
                        barraAlerta.showSnackBar({
                          text: 'Título atualizado!',
                          color: 'success',
                        });
                      } catch (err: unknown) {
                        const msg =
                          err instanceof Error
                            ? err.message
                            : 'Erro ao atualizar título';
                        barraAlerta.showSnackBar({ text: msg, color: 'error' });
                      }
                    }
                  }}
                  fullWidth
                  margin="normal"
                  size="small"
                />
                {mapaContext.modoVisao === MODO_VISAO.openstreetmap && (
                  <FormControl fullWidth>
                    <InputLabel id="simple-select-tile-label">
                      Selecione o plano de fundo
                    </InputLabel>
                    <Select
                      labelId="simple-select-tile-label"
                      id="simple-select-tile"
                      value={mapaContext.tipoMapaComum?.url ?? ''}
                      onChange={(e) => {
                        dispatch({
                          type: 'alteraPropriedadeGeral',
                          nomePropriedade: 'tipoMapaComum',
                          valorPropriedade: tiposPlanoFundo.find(
                            (x) => x.url === e.target.value
                          ),
                        });
                      }}
                      label="Plano de Fundo"
                    >
                      {tiposPlanoFundo.map((x, i) => (
                        <MenuItem value={x.url} key={`select#${i}`}>
                          {x.nome}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )}
                <FormControlLabel
                  control={
                    <Switch
                      checked={formik.values.exibirLimiteCenas}
                      onChange={(e, checked) => {
                        dispatch({
                          type: 'alteraPropriedadeGeral',
                          nomePropriedade: 'exibirLimiteCenas',
                          valorPropriedade: checked,
                          formik: formik,
                        });
                      }}
                      name={'exibirLimite'}
                    />
                  }
                  label={'Ver limites das cenas'}
                />
              </Container>
              <Container className="group-frame">
                <Typography variant="h6" className="title">
                  Tempo
                </Typography>

                <FormControl component="fieldset">
                  <FormLabel component="legend">Tipo de Tempo</FormLabel>
                  <RadioGroup
                    row
                    value={formik.values.tipoTempo ?? 'real'}
                    onChange={(e) => {
                      dispatch({
                        type: 'alteraPropriedadeGeral',
                        nomePropriedade: 'tipoTempo',
                        valorPropriedade: e.target.value,
                        formik: formik,
                      });
                    }}
                  >
                    <FormControlLabel
                      value="real"
                      control={<Radio />}
                      label="Tempo Real (Data/Hora)"
                    />
                    <FormControlLabel
                      value="numerico"
                      control={<Radio />}
                      label="Tempo Numérico (Inteiros)"
                    />
                  </RadioGroup>
                </FormControl>

                <Typography>Duração apresentação</Typography>
                <TimePicker
                  views={['minutes', 'seconds']}
                  format="mm:ss"
                  value={moment(0, 'milliseconds').add(
                    formik.values.duracaoApresentacao ?? 10000,
                    'milliseconds'
                  )}
                  onChange={(newValue) => {
                    formik.setFieldValue(
                      'duracaoApresentacao',
                      newValue.minute() * 60000 + newValue.second() * 1000
                    );
                  }}
                  onSelectedSectionsChange={(nv) => {
                    if (nv === null) {
                      dispatch({
                        type: 'alteraPropriedadeGeral',
                        nomePropriedade: 'duracaoApresentacao',
                        valorPropriedade: formik.values.duracaoApresentacao,
                        formik: formik,
                      });
                    }
                  }}
                />
                {formik.values.tipoTempo === 'numerico' ? (
                  <>
                    <TextField
                      fullWidth
                      id="cenaInicio"
                      name="cenaInicio"
                      label="Tempo Inicial (Número)"
                      type="number"
                      value={formik.values.cenaInicio}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      error={
                        formik.touched.cenaInicio &&
                        Boolean(formik.errors.cenaInicio)
                      }
                      helperText={
                        formik.touched.cenaInicio && formik.errors.cenaInicio
                      }
                    />
                    <TextField
                      fullWidth
                      id="cenaFim"
                      name="cenaFim"
                      label="Tempo Final (Número)"
                      type="number"
                      value={formik.values.cenaFim}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      error={
                        formik.touched.cenaFim && Boolean(formik.errors.cenaFim)
                      }
                      helperText={
                        formik.touched.cenaFim && formik.errors.cenaFim
                      }
                    />
                  </>
                ) : (
                  <>
                    <TextField
                      fullWidth
                      id="cenaInicio"
                      name="cenaInicio"
                      label="Inicio"
                      type="datetime-local"
                      value={formik.values.cenaInicio}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      error={
                        formik.touched.cenaInicio &&
                        Boolean(formik.errors.cenaInicio)
                      }
                      helperText={
                        formik.touched.cenaInicio && formik.errors.cenaInicio
                      }
                    />
                    <TextField
                      fullWidth
                      id="cenaFim"
                      name="cenaFim"
                      label="Final"
                      type="datetime-local"
                      value={formik.values.cenaFim}
                      inputProps={{
                        step: 1,
                      }}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      error={
                        formik.touched.cenaFim && Boolean(formik.errors.cenaFim)
                      }
                      helperText={
                        formik.touched.cenaFim && formik.errors.cenaFim
                      }
                    />
                  </>
                )}
              </Container>

              <Container className="group-frame">
                <Typography variant="h6" className="title">
                  Linha do Tempo
                </Typography>
                <FormControlLabel
                  control={
                    <Switch
                      checked={!formik.values.simpleTimeline}
                      onChange={(e, checked) => {
                        dispatch({
                          type: 'alteraPropriedadeGeral',
                          nomePropriedade: 'simpleTimeline',
                          valorPropriedade: !checked,
                          formik: formik,
                        });
                      }}
                      name={'simpleTimeline'}
                    />
                  }
                  label={'Separar por elementos'}
                />
              </Container>

              <Container className="group-frame">
                <Typography variant="h6" className="title">
                  Lista de Elementos
                </Typography>
                <ListaElementos />
              </Container>

              {/* <FormControlLabel
              control={
                <Switch
                  checked={formik.values.reloadTimelineOptions}
                  onChange={(e, c) => {
                    dispatch({
                      type: "alteraPropriedadeGeral",
                      tipo: e.target.name,
                      valor: c,
                      formik: formik,
                    });
                  }}
                  name={"reloadTimelineOptions"}
                />
              }
              label={"Recarregar linha do tempo"}
            /> */}
            </Form>
          );
        }}
      </Formik>
      <PainelCompartilhamento />
    </>
  );
}
