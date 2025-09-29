import React, { useState } from 'react';
import {
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Checkbox,
  IconButton,
  Typography,
  Box,
  Divider,
  Tooltip,
  Chip,
  Stack
} from '@mui/material';
import {
  Delete,
  SelectAll,
  ClearAll,
  LocationOn,
  ShowChart,
  RadioButtonUnchecked,
  Layers,
  AddPhotoAlternate
} from '@mui/icons-material';
import { useMapaContext, useMapaDispatch } from '@/components/Mapa/MapaContext';
import useCaixaDialogo from '@/components/CaixaDialogo/useCaixaDialogo';
import { montarDispatchSelecionarElemento } from '@/components/Mapa/MapaUtils/selecionarElementoHelper';

interface ElementoLista {
  id: string;
  nome: string;
  tipo: string;
  visivel?: boolean;
}

const ListaElementos: React.FC = () => {
  const mapaContext = useMapaContext();
  const dispatch = useMapaDispatch();
  const { openModalConfirm } = useCaixaDialogo();
  const [selectedItems, setSelectedItems] = useState<string[]>([]);

  // Obter todos os elementos do contexto
  const getAllElements = (): ElementoLista[] => {
    const elementos: ElementoLista[] = [];
    
    // Adicionar marcadores
    if (mapaContext.conteudo?.Marker) {
      mapaContext.conteudo.Marker.forEach(marker => {
        elementos.push({
          id: marker.id,
          nome: marker.nome || `Marcador ${marker.id}`,
          tipo: 'Marker',
          visivel: true
        });
      });
    }

    // Adicionar polígonos
    if (mapaContext.conteudo?.Polygon) {
      mapaContext.conteudo.Polygon.forEach(polygon => {
        elementos.push({
          id: polygon.id,
          nome: polygon.nome || `Polígono ${polygon.id}`,
          tipo: 'Polygon',
          visivel: true
        });
      });
    }

    // Adicionar linhas (LineString)
    if (mapaContext.conteudo?.LineString) {
      mapaContext.conteudo.LineString.forEach(linestring => {
        elementos.push({
          id: linestring.id,
          nome: linestring.nome || `Linha ${linestring.id}`,
          tipo: 'LineString',
          visivel: true
        });
      });
    }

    // Adicionar círculos
    if (mapaContext.conteudo?.Circle) {
      mapaContext.conteudo.Circle.forEach(circle => {
        elementos.push({
          id: circle.id,
          nome: circle.nome || `Círculo ${circle.id}`,
          tipo: 'Circle',
          visivel: true
        });
      });
    }

    // Adicionar imagens sobrepostas
    if (mapaContext.conteudo?.ImageOverlay) {
      mapaContext.conteudo.ImageOverlay.forEach(imageOverlay => {
        elementos.push({
          id: imageOverlay.id,
          nome: imageOverlay.nome || `Imagem ${imageOverlay.id}`,
          tipo: 'ImageOverlay',
          visivel: true
        });
      });
    }

    return elementos;
  };

  const elementos = getAllElements();

  // Função para obter ícone baseado no tipo
  const getIconByType = (tipo: string) => {
    switch (tipo) {
      case 'Marker':
        return <LocationOn fontSize="small" />;
      case 'Polygon':
        return <Layers fontSize="small" />;
      case 'LineString':
        return <ShowChart fontSize="small" />;
      case 'Circle':
        return <RadioButtonUnchecked fontSize="small" />;
      case 'ImageOverlay':
        return <AddPhotoAlternate fontSize="small" />;
      default:
        return <Layers fontSize="small" />;
    }
  };

  // Função para obter cor do chip baseado no tipo
  const getChipColor = (tipo: string): "default" | "primary" | "secondary" | "error" | "info" | "success" | "warning" => {
    switch (tipo) {
      case 'Marker':
        return 'error';
      case 'Polygon':
        return 'primary';
      case 'LineString':
        return 'success';
      case 'Circle':
        return 'warning';
      case 'ImageOverlay':
        return 'secondary';
      default:
        return 'default';
    }
  };

  const handleToggleItem = (id: string) => {
    setSelectedItems(prev => {
      if (prev.includes(id)) {
        return prev.filter(item => item !== id);
      }
      return [...prev, id];
    });
  };

  const handleSelectAll = () => {
    if (selectedItems.length === elementos.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(elementos.map(el => el.id));
    }
  };

  const handleDeleteSelected = () => {
    if (selectedItems.length === 0) return;

    openModalConfirm({
      title: 'Excluir elementos',
      message: `Tem certeza que deseja excluir ${selectedItems.length} elemento(s)?`,
      onConfirm: () => {
        selectedItems.forEach(id => {
          dispatch({
            type: 'removeElements',
            id: id
          });
        });
        setSelectedItems([]);
      },
    });
  };

  const handleSelectElement = (elemento: ElementoLista) => {
    // Seleciona o elemento no mapa
    const elementoCompleto = mapaContext.conteudo[elemento.tipo]?.find(
      el => el.id === elemento.id
    );
    
    if (elementoCompleto) {
      dispatch(montarDispatchSelecionarElemento(elementoCompleto, mapaContext));
    }
  };

  return (
    <Box sx={{ width: '100%', bgcolor: 'background.paper', mt: 2 }}>
      <Box sx={{ p: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
          Elementos ({elementos.length})
        </Typography>
        <Stack direction="row" spacing={0.5}>
          <Tooltip title={selectedItems.length === elementos.length ? "Desmarcar todos" : "Selecionar todos"}>
            <IconButton size="small" onClick={handleSelectAll}>
              {selectedItems.length === elementos.length ? <ClearAll /> : <SelectAll />}
            </IconButton>
          </Tooltip>
          <Tooltip title="Excluir selecionados">
            <span>
              <IconButton 
                size="small" 
                onClick={handleDeleteSelected}
                disabled={selectedItems.length === 0}
                color="error"
              >
                <Delete />
              </IconButton>
            </span>
          </Tooltip>
        </Stack>
      </Box>
      
      <Divider />
      
      {elementos.length === 0 ? (
        <Box sx={{ p: 2, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            Nenhum elemento no mapa
          </Typography>
        </Box>
      ) : (
        <List 
          dense 
          sx={{ 
            width: '100%', 
            maxHeight: 300, 
            overflow: 'auto',
            '& .MuiListItemButton-root': {
              pr: 1
            }
          }}
        >
          {elementos.map((elemento) => {
            const isSelected = selectedItems.includes(elemento.id);
            const isFocused = mapaContext.elementoFoco?.id === elemento.id || 
                            mapaContext.elementosFoco?.some(el => el.id === elemento.id);
            
            return (
              <ListItem
                key={elemento.id}
                disablePadding
                sx={{
                  bgcolor: isFocused ? 'action.selected' : 'inherit',
                  '&:hover': {
                    bgcolor: 'action.hover'
                  }
                }}
              >
                <ListItemButton
                  role={undefined}
                  onClick={() => handleSelectElement(elemento)}
                  dense
                >
                  <ListItemIcon sx={{ minWidth: 32 }}>
                    <Checkbox
                      edge="start"
                      checked={isSelected}
                      tabIndex={-1}
                      disableRipple
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleItem(elemento.id);
                      }}
                      size="small"
                    />
                  </ListItemIcon>
                  <ListItemIcon sx={{ minWidth: 32 }}>
                    {getIconByType(elemento.tipo)}
                  </ListItemIcon>
                  <ListItemText 
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body2" noWrap sx={{ flexGrow: 1 }}>
                          {elemento.nome}
                        </Typography>
                        <Chip 
                          label={elemento.tipo} 
                          size="small" 
                          color={getChipColor(elemento.tipo)}
                          sx={{ 
                            height: 18, 
                            fontSize: '0.65rem',
                            '& .MuiChip-label': {
                              px: 0.8
                            }
                          }}
                        />
                      </Box>
                    }
                  />
                </ListItemButton>
              </ListItem>
            );
          })}
        </List>
      )}
      
      {selectedItems.length > 0 && (
        <>
          <Divider />
          <Box sx={{ p: 1, bgcolor: 'action.hover' }}>
            <Typography variant="caption" color="text.secondary">
              {selectedItems.length} item(ns) selecionado(s)
            </Typography>
          </Box>
        </>
      )}
    </Box>
  );
};

export default ListaElementos;
