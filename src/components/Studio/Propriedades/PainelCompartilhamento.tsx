import useBarraAlerta from '@/components/BarraAlerta/useBarraAlerta';
import { useMapaStore } from '@/stores/mapaStore';
import LockIcon from '@mui/icons-material/Lock';
import PersonRemoveIcon from '@mui/icons-material/PersonRemove';
import PublicIcon from '@mui/icons-material/Public';
import ShareIcon from '@mui/icons-material/Share';
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  Divider,
  FormControl,
  FormControlLabel,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Switch,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { useCallback, useEffect, useState } from 'react';

export default function PainelCompartilhamento() {
  const {
    mapaId,
    mapaPublico,
    mapaPermissao,
    setStore,
    compartilhamentos,
    compartilhamentosMapaId,
  } = useMapaStore();
  const barraAlerta = useBarraAlerta();

  const [loadingLista, setLoadingLista] = useState(false);
  const [emailShare, setEmailShare] = useState('');
  const [permissaoShare, setPermissaoShare] = useState<'view' | 'edit'>('view');
  const [loadingShare, setLoadingShare] = useState(false);
  const [loadingPublico, setLoadingPublico] = useState(false);
  useEffect(() => {
    if (mapaId && mapaPublico === null) {
      fetch(`/api/mapas/${mapaId}`)
        .then((r) => r.json())
        .then((data) => {
          if (typeof data.publico === 'boolean')
            setStore({ mapaPublico: data.publico });
        })
        .catch(() => {});
    }
  }, [mapaId, mapaPublico, setStore]);

  const carregarCompartilhamentos = useCallback(
    async (force?: boolean) => {
      if (!mapaId) return;
      if (!force && compartilhamentosMapaId === mapaId) return;
      setStore({ compartilhamentosMapaId: mapaId });
      setLoadingLista(true);
      try {
        const res = await fetch(`/api/mapas/${mapaId}/compartilhamentos`);
        if (!res.ok) return;
        const data = await res.json();
        setStore({ compartilhamentos: data });
      } finally {
        setLoadingLista(false);
      }
    },
    [mapaId, compartilhamentosMapaId, setStore]
  );

  useEffect(() => {
    if (mapaId && mapaPermissao === 'dono') {
      carregarCompartilhamentos();
    }
  }, [mapaId, mapaPermissao, carregarCompartilhamentos]);

  const handleTogglePublico = async () => {
    if (!mapaId) return;
    const novoPublico = !mapaPublico;
    setLoadingPublico(true);
    try {
      const res = await fetch(`/api/mapas/${mapaId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ publico: novoPublico }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      setStore({ mapaPublico: novoPublico });
      barraAlerta.showSnackBar({
        text: novoPublico
          ? 'Mapa publicado com sucesso!'
          : 'Mapa despublicado.',
        color: 'success',
      });
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : 'Erro ao alterar visibilidade';
      barraAlerta.showSnackBar({ text: msg, color: 'error' });
    } finally {
      setLoadingPublico(false);
    }
  };

  const handleCompartilhar = async () => {
    if (!mapaId || !emailShare.trim()) return;
    setLoadingShare(true);
    try {
      const res = await fetch(`/api/mapas/${mapaId}/compartilhamentos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: emailShare.trim(),
          permissao: permissaoShare,
        }),
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error);
      }
      setEmailShare('');
      barraAlerta.showSnackBar({
        text: 'Mapa compartilhado com sucesso!',
        color: 'success',
      });
      carregarCompartilhamentos(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao compartilhar';
      barraAlerta.showSnackBar({ text: msg, color: 'error' });
    } finally {
      setLoadingShare(false);
    }
  };

  const handleRemover = async (usuarioId: string) => {
    if (!mapaId) return;
    try {
      const res = await fetch(`/api/mapas/${mapaId}/compartilhamentos`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usuarioId }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      setStore({
        compartilhamentos: compartilhamentos.filter(
          (c) => c.usuario_id !== usuarioId
        ),
      });
      barraAlerta.showSnackBar({ text: 'Acesso removido.', color: 'success' });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao remover';
      barraAlerta.showSnackBar({ text: msg, color: 'error' });
    }
  };

  if (!mapaId) return null;

  return (
    <Container className="group-frame">
      <Typography variant="h6" className="title">
        Compartilhamento
      </Typography>

      <Stack direction="row" alignItems="center" spacing={1} mb={1}>
        {mapaPublico ? (
          <PublicIcon color="primary" fontSize="small" />
        ) : (
          <LockIcon fontSize="small" color="action" />
        )}
        <FormControlLabel
          control={
            <Switch
              checked={mapaPublico ?? false}
              onChange={handleTogglePublico}
              disabled={loadingPublico || mapaPermissao !== 'dono'}
            />
          }
          label={
            <Typography variant="body2">
              {mapaPublico
                ? 'Público — qualquer pessoa pode visualizar'
                : 'Privado — apenas convidados podem acessar'}
            </Typography>
          }
        />
        {loadingPublico && <CircularProgress size={16} />}
      </Stack>

      {mapaPermissao === 'dono' && (
        <>
          <Divider sx={{ my: 1.5 }} />
          <Typography variant="subtitle2" gutterBottom>
            Convidar usuário
          </Typography>
          <Stack spacing={1}>
            <TextField
              label="E-mail do convidado"
              value={emailShare}
              onChange={(e) => setEmailShare(e.target.value)}
              size="small"
              fullWidth
              type="email"
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCompartilhar();
              }}
            />
            <Stack direction="row" spacing={1} alignItems="center">
              <FormControl size="small" sx={{ minWidth: 160 }}>
                <InputLabel>Permissão</InputLabel>
                <Select
                  value={permissaoShare}
                  label="Permissão"
                  onChange={(e) =>
                    setPermissaoShare(e.target.value as 'view' | 'edit')
                  }
                >
                  <MenuItem value="view">Apenas visualizar</MenuItem>
                  <MenuItem value="edit">Editar</MenuItem>
                </Select>
              </FormControl>
              <Button
                variant="contained"
                size="small"
                startIcon={
                  loadingShare ? <CircularProgress size={14} /> : <ShareIcon />
                }
                onClick={handleCompartilhar}
                disabled={loadingShare || !emailShare.trim()}
              >
                Compartilhar
              </Button>
            </Stack>
          </Stack>

          {(loadingLista || compartilhamentos.length > 0) && (
            <Box mt={2}>
              <Typography variant="subtitle2" gutterBottom>
                Com acesso
              </Typography>
              {loadingLista ? (
                <CircularProgress size={20} />
              ) : (
                <Stack spacing={0.5}>
                  {compartilhamentos.map((c) => (
                    <Stack
                      key={c.usuario_id}
                      direction="row"
                      alignItems="center"
                      justifyContent="space-between"
                      sx={{ py: 0.5 }}
                    >
                      <Typography
                        variant="body2"
                        sx={{
                          flex: 1,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {c.email ?? c.usuario_id}
                      </Typography>
                      <Stack direction="row" alignItems="center" spacing={0.5}>
                        <Chip
                          label={
                            c.permissao === 'edit' ? 'Editor' : 'Visualizador'
                          }
                          size="small"
                          variant="outlined"
                          color={c.permissao === 'edit' ? 'primary' : 'default'}
                        />
                        <Tooltip title="Remover acesso">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleRemover(c.usuario_id)}
                          >
                            <PersonRemoveIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </Stack>
                  ))}
                </Stack>
              )}
            </Box>
          )}
        </>
      )}
    </Container>
  );
}
