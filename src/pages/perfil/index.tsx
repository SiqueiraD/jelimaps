import React, { useEffect, useState } from "react";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  LinearProgress,
  Snackbar,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import StorageIcon from "@mui/icons-material/Storage";
import MapIcon from "@mui/icons-material/Map";
import PersonIcon from "@mui/icons-material/Person";
import SaveIcon from "@mui/icons-material/Save";
import { useSession } from "next-auth/react";
import DefaultTemplate from "@/main/template/DefaultTemplate";

interface PerfilInfo {
  nome: string | null;
  quota: number;
  totalUsado: number;
  disponivel: number;
  totalMapas: number;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 ** 3) return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
  return `${(bytes / 1024 ** 3).toFixed(2)} GB`;
}

export default function Perfil() {
  const { data: session, status } = useSession();
  const [info, setInfo] = useState<PerfilInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nomeEdit, setNomeEdit] = useState("");
  const [saving, setSaving] = useState(false);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: "success" | "error" }>({
    open: false, message: "", severity: "success",
  });

  useEffect(() => {
    if (status !== "authenticated") return;
    fetch("/api/perfil")
      .then((r) => r.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setInfo(data);
        setNomeEdit(data.nome ?? "");
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [status]);

  const handleSalvarNome = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/perfil", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome: nomeEdit }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erro ao salvar");
      setInfo((prev) => prev ? { ...prev, nome: data.nome } : prev);
      setSnackbar({ open: true, message: "Nome atualizado com sucesso!", severity: "success" });
    } catch (e: unknown) {
      setSnackbar({ open: true, message: e instanceof Error ? e.message : "Erro ao salvar", severity: "error" });
    } finally {
      setSaving(false);
    }
  };

  const usedPercent = info
    ? Math.min(100, (info.totalUsado / info.quota) * 100)
    : 0;

  const barColor =
    usedPercent >= 90 ? "error" : usedPercent >= 70 ? "warning" : "primary";

  const displayName = info?.nome ?? session?.user?.name ?? "—";

  return (
    <DefaultTemplate>
      <Box sx={{ maxWidth: 720, mx: "auto", p: 4 }}>
        {/* Header do usuário */}
        <Card elevation={2} sx={{ mb: 3 }}>
          <CardContent>
            <Stack direction="row" spacing={3} alignItems="center">
              <Avatar
                src={session?.user?.image ?? undefined}
                sx={{ width: 72, height: 72, fontSize: 32 }}
              >
                {displayName?.[0]?.toUpperCase()}
              </Avatar>
              <Box>
                <Typography variant="h5" fontWeight={600}>
                  {displayName}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {session?.user?.email}
                </Typography>
              </Box>
            </Stack>
          </CardContent>
        </Card>

        {loading ? (
          <Box display="flex" justifyContent="center" py={6}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error">{error}</Alert>
        ) : info ? (
          <Stack spacing={3}>
            {/* Dados pessoais */}
            <Card elevation={2}>
              <CardContent>
                <Stack direction="row" spacing={1} alignItems="center" mb={2}>
                  <PersonIcon color="primary" />
                  <Typography variant="h6" fontWeight={600}>
                    Dados pessoais
                  </Typography>
                </Stack>
                <Stack direction="row" spacing={2} alignItems="flex-start">
                  <TextField
                    label="Nome"
                    value={nomeEdit}
                    onChange={(e) => setNomeEdit(e.target.value)}
                    size="small"
                    sx={{ flex: 1 }}
                    inputProps={{ maxLength: 100 }}
                  />
                  <Button
                    variant="contained"
                    startIcon={<SaveIcon />}
                    onClick={handleSalvarNome}
                    disabled={saving || nomeEdit.trim() === "" || nomeEdit.trim() === info.nome}
                    size="medium"
                  >
                    {saving ? "Salvando…" : "Salvar"}
                  </Button>
                </Stack>
              </CardContent>
            </Card>

            {/* Armazenamento */}
            <Card elevation={2}>
              <CardContent>
                <Stack direction="row" spacing={1} alignItems="center" mb={2}>
                  <StorageIcon color="primary" />
                  <Typography variant="h6" fontWeight={600}>
                    Armazenamento
                  </Typography>
                </Stack>

                <Box mb={1}>
                  <LinearProgress
                    variant="determinate"
                    value={usedPercent}
                    color={barColor}
                    sx={{ height: 12, borderRadius: 6 }}
                  />
                </Box>

                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography variant="body2" color="text.secondary">
                    {formatBytes(info.totalUsado)} usados de {formatBytes(info.quota)}
                  </Typography>
                  <Chip
                    size="small"
                    color={barColor}
                    label={`${formatBytes(info.disponivel)} disponíveis`}
                  />
                </Stack>

                <Divider sx={{ my: 2 }} />

                <Stack direction="row" spacing={4}>
                  {[
                    { label: "Usado", value: formatBytes(info.totalUsado) },
                    { label: "Disponível", value: formatBytes(info.disponivel) },
                    { label: "Total", value: formatBytes(info.quota) },
                    { label: "Uso", value: `${usedPercent.toFixed(1)}%` },
                  ].map(({ label, value }) => (
                    <Box key={label}>
                      <Typography variant="caption" color="text.secondary">{label}</Typography>
                      <Typography variant="body1" fontWeight={600}>{value}</Typography>
                    </Box>
                  ))}
                </Stack>
              </CardContent>
            </Card>

            {/* Mapas */}
            <Card elevation={2}>
              <CardContent>
                <Stack direction="row" spacing={1} alignItems="center" mb={1}>
                  <MapIcon color="primary" />
                  <Typography variant="h6" fontWeight={600}>Mapas</Typography>
                </Stack>
                <Typography variant="h3" fontWeight={700} color="primary">
                  {info.totalMapas}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {info.totalMapas === 1 ? "mapa criado" : "mapas criados"}
                </Typography>
              </CardContent>
            </Card>
          </Stack>
        ) : null}
      </Box>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar((s) => ({ ...s, open: false }))}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </DefaultTemplate>
  );
}
