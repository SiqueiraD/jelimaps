import React, { useState } from 'react';
import { Box, IconButton, Paper } from '@mui/material';
import { Search, Close } from '@mui/icons-material';
import SearchBox from './SearchBox';
import { NominatimResult } from '@/services/nominatimService';
// import { useMapaDispatch, useMapaContext } from '../Mapa/MapaContext';
import CustomControlLeaflet, { POSITION_CLASSES_CUSTOM_CONTROL } from '../CustomControlLeaflet/CustomControlLeaflet';

interface SearchLocationControlProps {
  position?: keyof typeof POSITION_CLASSES_CUSTOM_CONTROL;
  onLocationFound?: (location: NominatimResult, polygon?: any) => void;
}

const SearchLocationControl: React.FC<SearchLocationControlProps> = ({
  position = 'topright',
  onLocationFound
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleLocationSelect = async (location: NominatimResult) => {
    
    if (onLocationFound) {
      onLocationFound(location);
    }

    // Fechar a caixa de busca após seleção
    // setTimeout(() => setIsOpen(false), 500);
  };

  return (
    <CustomControlLeaflet position={position}>
      <Box sx={{ position: 'relative', right: -50 }}>
        {!isOpen ? (
          <IconButton
            onClick={() => setIsOpen(true)}
            sx={{
              backgroundColor: 'white',
              boxShadow: 2,
              '&:hover': {
                backgroundColor: 'grey.100',
              },
            }}
            size="small"
            title="Buscar localização"
          >
            <Search />
          </IconButton>
        ) : (
          <Paper
            elevation={3}
            sx={{
              p: 1,
              display: 'flex',
              alignItems: 'center',
              gap: 1,
            }}
          >
            <SearchBox
              onLocationSelect={handleLocationSelect}
              placeholder="Buscar cidade, país, endereço..."
              sx={{ boxShadow: 0 }}
            />
            <IconButton
              onClick={() => {
                setIsOpen(false);
              }}
              size="small"
              title="Fechar busca"
            >
              <Close />
            </IconButton>
          </Paper>
        )}
      </Box>
    </CustomControlLeaflet>
  );
};

export default SearchLocationControl;
