import React from "react";
import {
  styled,
  List,
  Collapse,
  Divider,
  ListItemButton,
  ListItemText,
  ListItem,
  TextField,
  FormControlLabel,
  Switch,
  Slider,
  Typography,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Container,
  ImageList,
  ImageListItem,
} from "@mui/material";
import { HexColorPicker } from "react-colorful";
import { useMapaContext, useMapaDispatch } from "@/components/Mapa/MapaContext";
import { ExpandLess, ExpandMore } from "@mui/icons-material";
import { Form, Formik } from "formik";
import * as Yup from "yup";
import moment from "moment";
import MapaContextChanger from "@/components/Mapa/ContextChangers";
import useCaixaDialogo from "@/components/CaixaDialogo/useCaixaDialogo";
import Leaflet, { Map } from "leaflet";
import ImageResolver from "@/components/ImageUrlResolver";
import ImageUploadField from "@/components/Atomic/ImageUploadField";
import Button from "@/components/Atomic/Button";
import contextChangers from "@/components/Mapa/ContextChangers";
import useWindowDimensions from "../useWindowDimensions";
import Image from "next/image";

const WrapperStyled = styled("div")``;

export default function Elemento(props: { map: Map }) {
  const { map } = props;
  const mapaContext = useMapaContext();
  const dispatch = useMapaDispatch();
  const { height, width } = useWindowDimensions();
  const elementoRef = React.useRef(null);
  const carregaElementosFoco = React.useCallback(() => {
    return (
      mapaContext?.elementosFoco
        ?.map((x: any) =>
          MapaContextChanger.retornaElementoOuAlteracaoPorId(mapaContext, x.id)
        )
        .concat([
          MapaContextChanger.retornaElementoOuAlteracaoPorId(
            mapaContext,
            mapaContext?.elementoFoco?.id
          ),
        ])
        .filter(
          (x, i, a) => x && a.findIndex((z) => !!z && z.id === x.id) === i
        ) ?? [
        MapaContextChanger.retornaElementoOuAlteracaoPorId(
          mapaContext,
          mapaContext?.elementoFoco?.id
        ),
      ]
    );
  }, [mapaContext]);

  const [value, setValue] = React.useState<{ collapse: boolean }[]>(
    carregaElementosFoco().map((x) => {
      return { collapse: x.collapse };
    })
  );

  const urlImageRef = React.useRef<string>();
  const { openModalConfirm, closeModalConfirm, onConfirm } = useCaixaDialogo();

  const handleDispatchInserirImageOverlay = React.useCallback(async () => {
    dispatch({
      type: "editarPropriedade",
      tipo: elementoRef.current.dataRef,
      id: elementoRef.current.id,
      nomePropriedade: "imagemURL",
      valorPropriedade: await ImageResolver.UrlResolver(urlImageRef.current),
    });
    elementoRef.current = urlImageRef.current = null;
    closeModalConfirm(null, null);
  }, [dispatch, closeModalConfirm]);

  const handleInserirImagem = React.useCallback(() => {
    openModalConfirm({
      title: "",
      message: "",
      onConfirm,
      cancelarNotVisible: true,
      confirmarNotVisible: true,
      componentMessage: (
        <div>
          <DialogTitle>Por favor, insira a url da imagem</DialogTitle>
          <DialogContent dividers>
            <ImageUploadField
              defaultValue={urlImageRef.current ?? ""}
              onChange={(url) => { urlImageRef.current = url; }}
              mapaId={mapaContext.id}
              previewWidth={Math.round(width * 0.21)}
              previewHeight={Math.round(height * 0.21)}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleDispatchInserirImageOverlay}>Salvar</Button>
          </DialogActions>
        </div>
      ),
    });
  }, [openModalConfirm, onConfirm, width, height, mapaContext.id, handleDispatchInserirImageOverlay]);
  return (
    <List sx={{ height: "100%", pt: 0 }} key={"lista"}>
      {carregaElementosFoco() &&
        carregaElementosFoco().map((x, i) => {
          return (
            <WrapperStyled key={`Wrapper#${x}-${i}`}>
              <ListItemButton
                onClick={() => {
                  setValue((v) => {
                    v[i].collapse = !v[i].collapse;
                    return [...v];
                  });
                }}
              >
                <ListItemText primary={x.nome} />

                {x.collapse || value.length === 1 ? (
                  <ExpandLess />
                ) : (
                  <ExpandMore />
                )}
              </ListItemButton>
              <Collapse
                in={x.collapse || value.length === 1}
                className={x.nome}
                timeout="auto"
                unmountOnExit
              >
                <ListItem>
                  <Formik
                    initialValues={x}
                    onSubmit={() => console.log("submtou")}
                    validateOnBlur={true}
                    validationSchema={Yup.object({
                      cenaInicio: Yup.date().test(
                        "data-inicio-menor-que-fim",
                        "O inicio deve ser menor que o final da primeira cena.",
                        (value, context) =>
                          moment(value) <
                          moment(context.options.context.cenaFim)
                      ),
                      cenaFim: Yup.date().test(
                        "data-fim-maior-que-inicio",
                        "O final deve ser maior que o inicio da ultima cena.",
                        (value, context) =>
                          moment(value) >
                          moment(context.options.context.cenaInicio)
                      ),
                    })}
                  >
                    {(formik) => {
                      return (
                        <Form
                          onBlur={(e: any) => {
                            if (e.target.name && e.target.value)
                              dispatch({
                                type: "editarPropriedade",
                                tipo: x.dataRef,
                                id: x.id,
                                nomePropriedade: e.target.name,
                                valorPropriedade: e.target.value,
                              });
                          }}
                        >
                          <Button
                            onClick={() => {
                              dispatch({
                                type: "editarPropriedade",
                                tipo: x.dataRef,
                                id: x.id,
                                nomePropriedade: "zoom",
                                valorPropriedade: map.getZoom(),
                              });
                            }}
                          >
                            Fixar zoom
                          </Button>

                          <Container className="group-frame">
                            <Typography variant="h6" className="title">
                              Info
                            </Typography>
                            <TextField
                              fullWidth
                              id="nome"
                              name="nome"
                              type="text"
                              label="Nome"
                              value={formik.values.nome}
                              onChange={formik.handleChange}
                              onBlur={formik.handleBlur}
                              error={
                                formik.touched.nome &&
                                Boolean(formik.errors.nome)
                              }
                              helperText={
                                formik.touched.nome && formik.errors.nome
                              }
                            />
                            <TextField
                              fullWidth
                              id="texto"
                              name="texto"
                              label="Texto"
                              multiline
                              rows={4}
                              value={(formik.values as any).texto}
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
                            <Divider sx={{ height: 15 }} />
                            <Button
                              onClick={() => {
                                elementoRef.current = formik.values;
                                handleInserirImagem();
                              }}
                            >
                              {(formik.values as any).imagemURL &&
                              (formik.values as any).imagemURL.length
                                ? "Trocar imagem"
                                : "Inserir imagem"}
                            </Button>
                            {(formik.values as any).imagemURL &&
                              (formik.values as any).imagemURL.length && (
                                <Button
                                  onClick={() => {
                                    openModalConfirm({
                                      title: "Deletar item",
                                      message: "Você tem certeza disso?",
                                      onConfirm: () => {
                                        dispatch({
                                          type: "editarPropriedade",
                                          tipo: elementoRef.current.dataRef,
                                          id: elementoRef.current.id,
                                          nomePropriedade: "imagemURL",
                                          valorPropriedade: null,
                                        });
                                      },
                                    });
                                  }}
                                  variant="contained"
                                  size="small"
                                >
                                  {"Deletar imagem"}
                                </Button>
                              )}
                            {(formik.values as any).imagemURL &&
                              (formik.values as any).imagemURL.length && (
                                <ImageList>
                                  <ImageListItem cols={2}>
                                    {
                                      <Image
                                        src={(formik.values as any).imagemURL}
                                        width={width * 0.21}
                                        height={height * 0.21}
                                        alt={`Imagem carregada pelo link: ${
                                          (formik.values as any).imagemURL
                                        }`}
                                        placeholder="blur"
                                        blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=="
                                      />
                                    }
                                  </ImageListItem>
                                </ImageList>
                              )}
                          </Container>

                          <Container className="group-frame">
                            <Typography variant="h6" className="title">
                              Tempo
                            </Typography>
                            <FormControl fullWidth>
                              <InputLabel id="demo-simple-select-standard-label">
                                Selecione a cena
                              </InputLabel>
                              <Select
                                labelId="demo-simple-select-standard-label"
                                id="demo-simple-select-standard"
                                value={x.cenaSelecionada ?? ""}
                                sx={{
                                  backgroundColor: x.cenaSelecionada
                                    ? mapaContext.conteudo.cenas.find(
                                        (z) => z.id === x.cenaSelecionada
                                      ).color
                                    : "",
                                }}
                                onChange={(e) => {
                                  dispatch({
                                    type: "selecionarCenaParaElemento",
                                    elemento: x,
                                    tipo: x.dataRef,
                                    id: e.target.value,
                                  });
                                  // dispatch({
                                  //   type: "selecionarCena",
                                  //   id: c.props.value,
                                  //   tipo: "cenas",
                                  //   nomePropriedade: "properties",
                                  //   valorPropriedade: {
                                  //     ...mapaContext?.conteudo.cenas.find(
                                  //       (x) => x.id.toString() === c.props.value
                                  //     ).properties,
                                  //     selected: true,
                                  //   },
                                  // });
                                }}
                                label="Cena"
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
                            </FormControl>

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
                                formik.touched.cenaInicio &&
                                formik.errors.cenaInicio
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
                                formik.touched.cenaFim &&
                                Boolean(formik.errors.cenaFim)
                              }
                              helperText={
                                formik.touched.cenaFim && formik.errors.cenaFim
                              }
                            />
                          </Container>
                          {(formik.values as any).radius && (
                            <TextField
                              fullWidth
                              id="radius"
                              name="radius"
                              label="Raio do Circulo"
                              type="number"
                              value={(formik.values as any).radius}
                              onChange={formik.handleChange}
                              onBlur={formik.handleBlur}
                              error={
                                (formik.touched as any).radius &&
                                Boolean((formik.errors as any).radius)
                              }
                              helperText={
                                (formik.touched as any).radius &&
                                (formik.errors as any).radius
                              }
                            />
                          )}

                          <Container className="group-frame">
                            <Typography variant="h6" className="title">
                              Mapa
                            </Typography>
                            <FormControlLabel
                              control={
                                <Switch
                                  checked={formik.values.draggable}
                                  value={formik.values.draggable}
                                  onChange={(e) => {
                                    // mapaContext.conteudo[x.dataRef].find(
                                    //   (z) => z.id === x.id
                                    // ).draggable = !formik.values.draggable;
                                    dispatch({
                                      type: "editarPropriedade",
                                      tipo: x.dataRef,
                                      id: x.id,
                                      nomePropriedade: "draggable",
                                      valorPropriedade:
                                        !formik.values.draggable,
                                    });
                                    formik.handleChange(e);
                                  }}
                                  name={"draggable"}
                                />
                              }
                              label={"Editar elemento no mapa"}
                            />

                            <FormControl fullWidth>
                              <InputLabel id="simple-select-tile-label">
                                Selecione a cor
                              </InputLabel>
                              <HexColorPicker
                                color={(formik.values as any).color}
                                onChange={(newColor) => {
                                  dispatch({
                                    type: "editarPropriedade",
                                    tipo: x.dataRef,
                                    id: x.id,
                                    nomePropriedade: "color",
                                    valorPropriedade: newColor,
                                  });
                                }}
                              />
                            </FormControl>
                            {((formik.values as any).positionBL ||
                              (formik.values as any).dataRef === "Marker") &&
                              ((formik.values as any).opacity ? (
                                <>
                                  <Typography>Opacidade</Typography>
                                  <Slider
                                    value={(formik.values as any).opacity}
                                    name=""
                                    min={0}
                                    step={0.1}
                                    max={1}
                                    onChange={(e, newV) =>
                                      dispatch({
                                        type: "editarPropriedade",
                                        tipo: x.dataRef,
                                        id: x.id,
                                        nomePropriedade: "opacity",
                                        valorPropriedade: newV,
                                      })
                                    }
                                    valueLabelDisplay="auto"
                                    aria-labelledby="non-linear-slider"
                                  />
                                </>
                              ) : (
                                <Button
                                  onClick={() =>
                                    dispatch({
                                      type: "editarPropriedade",
                                      tipo: x.dataRef,
                                      id: x.id,
                                      nomePropriedade: "opacity",
                                      valorPropriedade: 0.9,
                                    })
                                  }
                                >
                                  {(formik.values as any).opacity === 0
                                    ? "Exibir elemento"
                                    : "Ativar Opacidade"}
                                </Button>
                              ))}
                            <Button
                              onClick={() => {
                                const bordas = contextChangers.bordasDoElemento(
                                  x,
                                  map,
                                  Leaflet,
                                  0
                                );
                                bordas && map.setView(bordas.getCenter());
                              }}
                            >
                              {"Ver no mapa"}
                            </Button>
                          </Container>
                        </Form>
                      );
                    }}
                  </Formik>
                </ListItem>
              </Collapse>
              <Divider />
            </WrapperStyled>
          );
        })}
    </List>
  );
}
