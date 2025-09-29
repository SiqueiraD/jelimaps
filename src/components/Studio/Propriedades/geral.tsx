import React from "react";
import {
  Button,
  ButtonGroup,
  Container,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Select,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import { TimePicker } from "@mui/x-date-pickers/TimePicker";
import {
  useMapaContext,
  useMapaDispatch,
  useMapaUndo,
} from "@/components/Mapa/MapaContext";
import { Form, Formik } from "formik";
import * as Yup from "yup";
import useCaixaDialogo from "@/components/CaixaDialogo/useCaixaDialogo";
import { useRouter } from "next/router";
import moment from "moment";
import { MODO_VISAO } from "@/components/Mapa/mapaContextTypes";
import tiposPlanoFundo from "@/components/Mapa/PlanoFundoMapaComum/tiposPlanoFundo";
import ListaElementos from "./ListaElementos";

export default function Geral() {
  const mapaContext = useMapaContext();
  const { reset } = useMapaUndo();
  const dispatch = useMapaDispatch();
  const { openModalConfirm } = useCaixaDialogo();
  const router = useRouter();

  return (
    <Formik
      initialValues={mapaContext}
      onSubmit={() => console.log("submtou")}
      validateOnBlur={true}
      validationSchema={Yup.object({
        cenaInicio: Yup.date().max(
          mapaContext.conteudo.cenas[0].cenaFim,
          "O inicio deve ser menor que o final da primeira cena."
        ),
        cenaFim: Yup.date().min(
          mapaContext.conteudo.cenas[mapaContext.conteudo.cenas.length - 1]
            .cenaInicio,
          "O final deve ser maior que o inicio da ultima cena."
        ),
      })}
    >
      {(formik) => {
        return (
          <Form
            onBlur={(e: any) => {
              if (!!e.target.name && !!e.target.value)
                dispatch({
                  type: "alteraPropriedadeGeral",
                  nomePropriedade: e.target.name,
                  valorPropriedade: e.target.value,
                  formik: formik,
                });
            }}
          >
            <ButtonGroup variant="outlined" aria-label="outlined button group">
              <Button onClick={() => router.push("/")}>Sair</Button>
              <Button
                onClick={() => {
                  openModalConfirm({
                    title: "Começar um novo",
                    message:
                      "Vai perder todas alterações feitas, tem certeza disso?",
                    onConfirm: () => {
                      reset();
                    },
                  });
                }}
              >
                Resetar
              </Button>
              {/* <Button component="label">
                Importar
                <VisuallyHiddenInput type="file" />
              </Button> */}
              <Button
                onClick={() => {
                  const conteudo = JSON.stringify(mapaContext);
                  const blob = new Blob([conteudo], { type: "text/plain" });
                  var url = URL.createObjectURL(blob);
                  var a = document.createElement("a");
                  a.href = url;
                  a.download = "arquivo.griot";
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                  URL.revokeObjectURL(url);
                }}
              >
                Exportar
              </Button>
            </ButtonGroup>

            <Container className="group-frame">
              <Typography variant="h6" className="title">
                Mapa
              </Typography>
              {mapaContext.modoVisao === MODO_VISAO.openstreetmap && (
                <FormControl fullWidth>
                  <InputLabel id="simple-select-tile-label">
                    Selecione o plano de fundo
                  </InputLabel>
                  <Select
                    labelId="simple-select-tile-label"
                    id="simple-select-tile"
                    value={mapaContext.tipoMapaComum?.url ?? ""}
                    onChange={(e) => {
                      dispatch({
                        type: "alteraPropriedadeGeral",
                        nomePropriedade: "tipoMapaComum",
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
                        type: "alteraPropriedadeGeral",
                        nomePropriedade: "exibirLimiteCenas",
                        valorPropriedade: checked,
                        formik: formik,
                      });
                    }}
                    name={"exibirLimite"}
                  />
                }
                label={"Ver limites das cenas"}
              />
            </Container>
            <Container className="group-frame">
              <Typography variant="h6" className="title">
                Tempo
              </Typography>

              <Typography>Duração apresentação</Typography>
              <TimePicker
                views={["minutes", "seconds"]}
                format="mm:ss"
                value={moment(0, "milliseconds").add(
                  formik.values.duracaoApresentacao ?? 10000,
                  "milliseconds"
                )}
                onChange={(newValue) => {
                  formik.setFieldValue(
                    "duracaoApresentacao",
                    newValue.minute() * 60000 + newValue.second() * 1000
                  );
                }}
                onSelectedSectionsChange={(nv) => {
                  if (nv === null) {
                    dispatch({
                      type: "alteraPropriedadeGeral",
                      nomePropriedade: "duracaoApresentacao",
                      valorPropriedade: formik.values.duracaoApresentacao,
                      formik: formik,
                    });
                  }
                }}
              />
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
                  formik.touched.cenaInicio && Boolean(formik.errors.cenaInicio)
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
                error={formik.touched.cenaFim && Boolean(formik.errors.cenaFim)}
                helperText={formik.touched.cenaFim && formik.errors.cenaFim}
              />
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
                        type: "alteraPropriedadeGeral",
                        nomePropriedade: "simpleTimeline",
                        valorPropriedade: !checked,
                        formik: formik,
                      });
                    }}
                    name={"simpleTimeline"}
                  />
                }
                label={"Separar por elementos"}
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
  );
}
