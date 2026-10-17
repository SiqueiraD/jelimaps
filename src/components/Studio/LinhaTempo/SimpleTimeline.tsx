import useCaixaDialogo from '@/components/CaixaDialogo/useCaixaDialogo';
import { useMapaContext, useMapaDispatch } from '@/components/Mapa/MapaContext';
import { elementoPadrao } from '@/components/Mapa/mapaContextTypes';
import { Add, Delete, DragIndicator } from '@mui/icons-material';
import {
    Box,
    Card,
    IconButton,
    Stack,
    TextField,
    Typography,
} from '@mui/material';
import moment from 'moment';
import React from 'react';
import { ReactSortable } from 'react-sortablejs';

const formatDuration = (cena: elementoPadrao) => {
  const seconds = Math.max(
    1,
    moment(cena.cenaFim).diff(moment(cena.cenaInicio), 'seconds')
  );
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return minutes ? `${minutes}m ${remainder}s` : `${seconds}s`;
};

export default function SimpleTimeline() {
  const mapaContext = useMapaContext();
  const dispatch = useMapaDispatch();
  const { openModalConfirm } = useCaixaDialogo();
  const [cenas, setCenas] = React.useState<elementoPadrao[]>(
    mapaContext.conteudo.cenas
  );

  React.useEffect(() => {
    setCenas(mapaContext.conteudo.cenas);
  }, [mapaContext.conteudo.cenas]);

  return (
    <Stack direction="row" alignItems="stretch" sx={{ width: '100%', p: 1 }}>
      <Box sx={{ minWidth: 110, p: 1 }}>
        <Typography variant="overline">Linha do tempo</Typography>
        <Typography variant="caption" display="block">
          {cenas.length} {cenas.length === 1 ? 'cena' : 'cenas'}
        </Typography>
      </Box>
      <ReactSortable
        list={cenas}
        setList={setCenas}
        direction="horizontal"
        animation={150}
        handle=".scene-drag-handle"
        onEnd={(event) => {
          if (event.oldIndex === undefined || event.newIndex === undefined) return;
          const reordered = [...mapaContext.conteudo.cenas];
          const [moved] = reordered.splice(event.oldIndex, 1);
          reordered.splice(event.newIndex, 0, moved);
          dispatch({
            type: 'reorderSimpleScenes',
            sceneIds: reordered.map((cena) => cena.id),
          });
        }}
        style={{
          display: 'flex',
          gap: 12,
          overflowX: 'auto',
          flex: 1,
          padding: 4,
        }}
      >
        {cenas.map((cena) => {
          const selected = cena.id === mapaContext.activeSceneId;
          return (
            <Card
              key={cena.id}
              variant="outlined"
              sx={{
                minWidth: 190,
                borderColor: selected ? 'primary.main' : 'divider',
                borderWidth: selected ? 2 : 1,
                bgcolor: selected ? 'action.selected' : 'background.paper',
              }}
            >
              <Stack direction="row" alignItems="center" sx={{ pr: 0.5 }}>
                <IconButton
                  className="scene-drag-handle"
                  size="small"
                  aria-label={`Reordenar ${cena.nome}`}
                >
                  <DragIndicator />
                </IconButton>
                <Box
                  role="button"
                  tabIndex={0}
                  onClick={() =>
                    dispatch({ type: 'selectSimpleScene', id: cena.id })
                  }
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      dispatch({ type: 'selectSimpleScene', id: cena.id });
                    }
                  }}
                  aria-label={`Selecionar cena ${cena.nome}`}
                  sx={{ p: 1, cursor: 'pointer' }}
                >
                  <TextField
                    variant="standard"
                    value={cena.nome}
                    onClick={(event) => event.stopPropagation()}
                    onChange={(event) =>
                      setCenas((current) =>
                        current.map((item) =>
                          item.id === cena.id
                            ? { ...item, nome: event.target.value }
                            : item
                        )
                      )
                    }
                    onBlur={(event) =>
                      dispatch({
                        type: 'editarPropriedade',
                        tipo: 'cenas',
                        id: cena.id,
                        nomePropriedade: 'nome',
                        valorPropriedade: event.target.value,
                      })
                    }
                    inputProps={{
                      'aria-label': `Nome da cena ${cena.nome}`,
                    }}
                  />
                  <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                    {formatDuration(cena)}
                  </Typography>
                </Box>
                {cenas.length > 1 && (
                  <IconButton
                    size="small"
                    color="error"
                    aria-label={`Excluir cena ${cena.nome}`}
                    onClick={() =>
                      openModalConfirm({
                        title: 'Deletar cena',
                        message:
                          'A cena e todos os elementos exclusivos dela serão removidos. Você tem certeza?',
                        onConfirm: () =>
                          dispatch({ type: 'deletarCena', id: cena.id }),
                      })
                    }
                  >
                    <Delete />
                  </IconButton>
                )}
              </Stack>
            </Card>
          );
        })}
      </ReactSortable>
      <IconButton
        aria-label="Adicionar cena"
        onClick={() => dispatch({ type: 'inserindoNovaCena' })}
        sx={{ alignSelf: 'center', mx: 1, border: 1, borderColor: 'divider' }}
      >
        <Add />
      </IconButton>
    </Stack>
  );
}
