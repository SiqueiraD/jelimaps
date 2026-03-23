import React, { useCallback, useEffect, useState } from "react";
import { useSession, signIn } from "next-auth/react";
import { useRouter } from "next/router";
import DefaultTemplate from "@/main/template/DefaultTemplate";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardActions from "@mui/material/CardActions";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import Container from "@mui/material/Container";
import Grid2 from "@mui/material/Grid2";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import PublicIcon from "@mui/icons-material/Public";
import LockIcon from "@mui/icons-material/Lock";
import AddIcon from "@mui/icons-material/Add";
import useCaixaDialogo from "@/components/CaixaDialogo/useCaixaDialogo";
import { MapaResumo } from "@/services/supabaseMapaService";

export default function MeusMapas() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { openModalConfirm } = useCaixaDialogo();

  const [mapas, setMapas] = useState<MapaResumo[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const carregarMapas = useCallback(async () => {
    setCarregando(true);
    setErro(null);
    try {
      const res = await fetch("/api/mapas");
      if (!res.ok) throw new Error("Erro ao carregar mapas");
      const data = await res.json();
      setMapas(data);
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro desconhecido");
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    if (status === "authenticated") {
      carregarMapas();
    }
  }, [status, carregarMapas]);

  const handleDeletar = (mapa: MapaResumo) => {
    openModalConfirm({
      title: `Excluir "${mapa.titulo}"`,
      message: "Esta ação não pode ser desfeita. Deseja continuar?",
      confirmarTitle: "Excluir",
      cancelarTitle: "Cancelar",
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/mapas/${mapa.id}`, { method: "DELETE" });
          if (!res.ok) throw new Error("Erro ao excluir mapa");
          setMapas((prev) => prev.filter((m) => m.id !== mapa.id));
        } catch (e) {
          setErro(e instanceof Error ? e.message : "Erro ao excluir");
        }
      },
      onCancel: () => {},
    });
  };

  if (status === "loading") {
    return (
      <DefaultTemplate>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
          <CircularProgress />
        </Box>
      </DefaultTemplate>
    );
  }

  if (status === "unauthenticated") {
    return (
      <DefaultTemplate>
        <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" minHeight="60vh" gap={2}>
          <Typography variant="h5">Você precisa estar logado para ver seus mapas.</Typography>
          <Button variant="contained" onClick={() => signIn("google")}>
            Entrar com Google
          </Button>
        </Box>
      </DefaultTemplate>
    );
  }

  return (
    <DefaultTemplate>
      <Box sx={{ bgcolor: "background.paper", pt: 4, pb: 2 }}>
        <Container maxWidth="md">
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="h4" component="h1">
              Meus Mapas
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => router.push("/mapa")}
            >
              Novo mapa
            </Button>
          </Stack>
          {session?.user?.name && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              {session.user.name}
            </Typography>
          )}
        </Container>
      </Box>

      <Box sx={{ backgroundImage: "linear-gradient(white, #1976d257)", pt: 4, pb: 6, minHeight: "60vh" }}>
        <Container maxWidth="md">
          {carregando && (
            <Box display="flex" justifyContent="center" py={8}>
              <CircularProgress />
            </Box>
          )}

          {erro && (
            <Box display="flex" flexDirection="column" alignItems="center" gap={2} py={8}>
              <Typography color="error">{erro}</Typography>
              <Button variant="outlined" onClick={carregarMapas}>
                Tentar novamente
              </Button>
            </Box>
          )}

          {!carregando && !erro && mapas.length === 0 && (
            <Box display="flex" flexDirection="column" alignItems="center" gap={2} py={8}>
              <Typography variant="h6" color="text.secondary">
                Você ainda não tem mapas salvos.
              </Typography>
              <Button variant="contained" startIcon={<AddIcon />} onClick={() => router.push("/mapa")}>
                Criar primeiro mapa
              </Button>
            </Box>
          )}

          {!carregando && !erro && mapas.length > 0 && (
            <Grid2 container spacing={3}>
              {mapas.map((mapa) => (
                <Grid2 key={mapa.id} size={{ xs: 12, sm: 6, md: 4 }}>
                  <Card sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
                    <CardContent sx={{ flexGrow: 1 }}>
                      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={1}>
                        <Typography gutterBottom variant="h6" component="h2" sx={{ mb: 0 }}>
                          {mapa.titulo || "Sem título"}
                        </Typography>
                        <Tooltip title={mapa.publico ? "Público" : "Privado"}>
                          {mapa.publico ? (
                            <PublicIcon fontSize="small" color="action" />
                          ) : (
                            <LockIcon fontSize="small" color="action" />
                          )}
                        </Tooltip>
                      </Stack>

                      {mapa.permissao && mapa.permissao !== "dono" && (
                        <Chip
                          label={mapa.permissao === "edit" ? "Editor" : "Visualizador"}
                          size="small"
                          variant="outlined"
                          sx={{ mb: 1 }}
                        />
                      )}

                      <Typography variant="caption" color="text.secondary" display="block">
                        Atualizado em{" "}
                        {new Date(mapa.updated_at).toLocaleDateString("pt-BR", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </Typography>
                    </CardContent>

                    <CardActions sx={{ justifyContent: "space-between" }}>
                      <Button
                        size="small"
                        variant="contained"
                        startIcon={<EditIcon />}
                        onClick={() => router.push(`/mapa/visualizacao?id=${mapa.id}`)}
                      >
                        Abrir
                      </Button>
                      {mapa.permissao === "dono" && (
                        <Tooltip title="Excluir mapa">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleDeletar(mapa)}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                    </CardActions>
                  </Card>
                </Grid2>
              ))}
            </Grid2>
          )}
        </Container>
      </Box>
    </DefaultTemplate>
  );
}
