import Button from "@/components/Atomic/Button";
import useCaixaDialogo from "@/components/CaixaDialogo/useCaixaDialogo";
import { useMapaContext, useMapaDispatch } from "@/components/Mapa/MapaContext";
import { elementoPadrao } from "@/components/Mapa/mapaContextTypes";
import { Queue } from "@mui/icons-material";
import {
    Container,
    FormControl,
    InputLabel,
    ListItem,
    ListItemButton,
    ListItemText,
    MenuItem,
    Select,
    TextField,
    Typography,
} from "@mui/material";
import { Form, Formik } from "formik";
import moment from "moment";
import React, { useState } from "react";
import * as Yup from "yup";

export default function Cenas() {
  const mapaContext = useMapaContext();
  const dispatch = useMapaDispatch();

  const cenaSelectedRef = React.useRef(
    mapaContext?.conteudo.cenas.find((x) => x.properties?.selected) ??
      mapaContext?.conteudo.cenas[0]
  );
  if (mapaContext.timelineMode === "simple") {
    cenaSelectedRef.current =
      mapaContext.conteudo.cenas.find(
        (cena) => cena.id === mapaContext.activeSceneId
      ) ?? mapaContext.conteudo.cenas[0];
  }
  const [index, setIndex] = useState(0);
  const [troca, setTroca] = useState(false);
  React.useEffect(() => {
    const i = mapaContext?.conteudo.cenas.findIndex(
      (x) => x.id === cenaSelectedRef.current.id
    );
    if (cenaSelectedRef.current && cenaSelectedRef.current.id && i != index) {
      setIndex(i);
      setTroca(!troca);
    }
  }, [index, mapaContext?.conteudo.cenas, troca]);

  const CenaSelecionadaComponent = () => {
    const { openModalConfirm } = useCaixaDialogo();
    return (
      <ListItem>
        <Formik
          enableReinitialize
          initialValues={
            {
              ...cenaSelectedRef.current,
              durationSeconds: Math.max(
                1,
                moment(cenaSelectedRef.current.cenaFim).diff(
                  moment(cenaSelectedRef.current.cenaInicio),
                  "seconds"
                )
              ),
            } as elementoPadrao & { durationSeconds: number }
          }
          onSubmit={() => console.log("submtou")}
          validateOnChange={true}
          validationSchema={Yup.object({
            cenaInicio: Yup.date().test(
              "data-inicio-menor-que-fim",
              "O inicio deve ser menor que o final da primeira cena.",
              (value, context) =>
                moment(value) < moment(context.options.context.cenaFim)
            ),
            cenaFim: Yup.date().test(
              "data-fim-maior-que-inicio",
              "O final deve ser maior que o inicio da ultima cena.",
              (value, context) =>
                moment(value) > moment(context.options.context.cenaInicio)
            ),
          })}
        >
          {(formik) => {
            return (
              <Form
                onBlur={(e: any) => {
                  if (e.target.name === "durationSeconds") {
                    dispatch({
                      type: "changeSimpleSceneDuration",
                      id: cenaSelectedRef.current.id,
                      durationSeconds: Number(e.target.value),
                    });
                  } else {
                    dispatch({
                      type: "alteraPropriedadeCena",
                      tipo: e.target.name,
                      valor: e.target.value,
                      indiceElemento: index,
                      formik: formik,
                    });
                  }
                }}
              >
                <Container className="group-frame">
                  <Typography variant="h6" className="title">
                    Info
                  </Typography>
                  <TextField
                    fullWidth
                    id="nome"
                    name="nome"
                    label="Título"
                    value={formik.values.nome}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={
                      (formik.touched as any).nome &&
                      Boolean((formik.errors as any).nome)
                    }
                    helperText={
                      (formik.touched as any).nome &&
                      (formik.errors as any).nome
                    }
                  />
                  <TextField
                    fullWidth
                    id="texto"
                    name="texto"
                    label="Texto"
                    multiline
                    rows={4}
                    value={formik.values.texto}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={
                      (formik.touched as any).texto &&
                      Boolean((formik.errors as any).texto)
                    }
                    helperText={
                      (formik.touched as any).texto &&
                      (formik.errors as any).texto
                    }
                  />
                </Container>
                <Container className="group-frame">
                  <Typography variant="h6" className="title">
                    Tempo
                  </Typography>
                  {mapaContext.timelineMode === "simple" ? (
                    <TextField
                      fullWidth
                      id="durationSeconds"
                      name="durationSeconds"
                      label="Duração (segundos)"
                      type="number"
                      value={formik.values.durationSeconds}
                      inputProps={{ min: 1, step: 1 }}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      error={
                        formik.touched.durationSeconds &&
                        (!Number.isInteger(Number(formik.values.durationSeconds)) ||
                          Number(formik.values.durationSeconds) < 1)
                      }
                      helperText={
                        formik.touched.durationSeconds &&
                        (!Number.isInteger(Number(formik.values.durationSeconds)) ||
                          Number(formik.values.durationSeconds) < 1)
                          ? "Use um número inteiro de pelo menos 1 segundo."
                          : ""
                      }
                    />
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
                        inputProps={{ step: 1 }}
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
                {/* <FormControlLabel
              control={
                <Switch
                  checked={formik.values.exibirLimite}
                  onChange={(e, checked) => {
                    dispatch({
                      type: "alteraPropriedadeCena",
                      tipo: "exibirLimite",
                      valor: checked,
                      indiceElemento: i,
                      formik: formik,
                    });
                  }}
                  name={"exibirLimite"}
                />
              }
              label={"Exibir tamanho da cena"}
            /> */}
                <Button
                  onClick={() => {
                    dispatch({
                      type: "fixarCena",
                      id: cenaSelectedRef.current.id,
                    });
                  }}
                >
                  Fixar tela
                </Button>
                {mapaContext?.conteudo.cenas.length > 1 && (
                  <Button
                    variant="outlined"
                    color="error"
                    onClick={() => {
                      openModalConfirm({
                        title: "Deletar item",
                        message: "Você tem certeza disso?",
                        onConfirm: () => {
                          dispatch({
                            type: "deletarCena",
                            id: cenaSelectedRef.current.id,
                          });
                        },
                      });
                    }}
                  >
                    Deletar Cena
                  </Button>
                )}
              </Form>
            );
          }}
        </Formik>
      </ListItem>
    );
  };
  return (
    <>
      <FormControl variant="standard" sx={{ m: 1, minWidth: 120 }} fullWidth>
        <InputLabel id="demo-simple-select-standard-label">
          Escolha a cena para editar
        </InputLabel>
        <Select
          labelId="demo-simple-select-standard-label"
          id="demo-simple-select-standard"
          sx={{ backgroundColor: cenaSelectedRef.current?.color }}
          value={
            cenaSelectedRef.current?.id ?? mapaContext?.conteudo.cenas[0].id
          }
          onChange={(e, c: any) => {
            cenaSelectedRef.current = mapaContext.conteudo.cenas.find(
              (cena) => cena.id === c.props.value
            );
            if (mapaContext.timelineMode === "simple") {
              dispatch({ type: "selectSimpleScene", id: c.props.value });
            } else dispatch({
              type: "selecionarCena",
              id: c.props.value,
              tipo: "cenas",
              nomePropriedade: "properties",
              valorPropriedade: {
                ...mapaContext?.conteudo.cenas.find(
                  (x) => x.id.toString() === c.props.value
                ).properties,
                selected: true,
              },
            });
            // setCenaSelecionada(
            //   mapaContext?.conteudo.cenas.find(
            //     (x) => x.id.toString() === c.props.value
            //   )
            // );
          }}
          label="Age"
        >
          {mapaContext?.conteudo.cenas &&
            mapaContext?.conteudo.cenas.map((x, i) => (
              <MenuItem
                style={{ backgroundColor: x.color }}
                value={x.id}
                key={`select#${i}`}
              >
                {x.nome}
              </MenuItem>
            ))}
        </Select>
        <ListItemButton onClick={() => dispatch({ type: "inserindoNovaCena" })}>
          <ListItemText primary="Criar nova cena" />
          <Queue />
        </ListItemButton>
      </FormControl>
      {cenaSelectedRef.current &&
        (troca ? <CenaSelecionadaComponent /> : <CenaSelecionadaComponent />)}
    </>
  );
}
