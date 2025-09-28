import React, { useState, useEffect, useRef } from 'react';
import {
  TextField,
  Autocomplete,
  Box,
  CircularProgress,
  Paper,
  Typography,
  Chip,
  InputAdornment
} from '@mui/material';
import { Search, LocationOn } from '@mui/icons-material';
import nominatimService, { NominatimResult } from '@/services/nominatimService';
import { debounce } from '@mui/material/utils';

interface SearchBoxProps {
  onLocationSelect: (location: NominatimResult) => void;
  placeholder?: string;
  sx?: any;
}

const SearchBox: React.FC<SearchBoxProps> = ({
  onLocationSelect,
  placeholder = 'Buscar localização...',
  sx
}) => {
  const [inputValue, setInputValue] = useState('');
  const [options, setOptions] = useState<NominatimResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  // Debounce para evitar muitas requisições
  const fetchLocations = useRef(
    debounce(async (query: string) => {
      if (query.length < 3) {
        setOptions([]);
        return;
      }

      setLoading(true);
      try {
        const results = await nominatimService.search(query, {
          limit: 8,
          includePolygon: true
        });
        setOptions(results);
      } catch (error) {
        console.error('Erro ao buscar localizações:', error);
        setOptions([]);
      } finally {
        setLoading(false);
      }
    }, 500)
  ).current;

  useEffect(() => {
    fetchLocations(inputValue);
  }, [inputValue, fetchLocations]);

  // Função para formatar o tipo de lugar
  const getPlaceType = (result: NominatimResult): string => {
    const typeMap: { [key: string]: string } = {
      'country': 'País',
      'state': 'Estado',
      'city': 'Cidade',
      'town': 'Cidade',
      'village': 'Vila',
      'suburb': 'Bairro',
      'neighbourhood': 'Vizinhança',
      'hamlet': 'Povoado',
      'administrative': 'Região Administrativa',
      'municipality': 'Município',
      'district': 'Distrito',
      'county': 'Condado',
      'region': 'Região'
    };

    return typeMap[result.type] || typeMap[result.class] || 'Local';
  };

  // Função para extrair nome principal e detalhes
  const formatDisplayName = (displayName: string): { main: string; details: string } => {
    const parts = displayName.split(',');
    const main = parts[0].trim();
    const details = parts.slice(1, 3).join(',').trim();
    return { main, details };
  };

  return (
    <Autocomplete
      sx={{
        width: 400,
        backgroundColor: 'white',
        borderRadius: 1,
        boxShadow: 2,
        ...sx
      }}
      open={open}
      onOpen={() => setOpen(true)}
      onClose={() => setOpen(false)}
      options={options}
      loading={loading}
      inputValue={inputValue}
      onInputChange={(event, newInputValue) => {
        setInputValue(newInputValue);
      }}
      onChange={(event, value) => {
        if (value) {
          onLocationSelect(value);
          setInputValue('');
        }
      }}
      getOptionLabel={(option) => formatDisplayName(option.display_name).main}
      filterOptions={(x) => x} // Desabilita filtro local, já filtramos no servidor
      renderInput={(params) => (
        <TextField
          {...params}
          placeholder={placeholder}
          variant="outlined"
          size="small"
          InputProps={{
            ...params.InputProps,
            startAdornment: (
              <InputAdornment position="start">
                <Search />
              </InputAdornment>
            ),
            endAdornment: (
              <>
                {loading ? <CircularProgress color="inherit" size={20} /> : null}
                {params.InputProps.endAdornment}
              </>
            ),
          }}
        />
      )}
      renderOption={(props, option) => {
        const { main, details } = formatDisplayName(option.display_name);
        const placeType = getPlaceType(option);
        const hasPolygon = option.geojson && option.geojson.type !== 'Point';
        
        return (
          <Box component="li" {...props}>
            <LocationOn sx={{ mr: 1, color: 'text.secondary', flexShrink: 0 }} />
            <Box sx={{ flexGrow: 1 }}>
              <Typography variant="body1" component="div">
                {main}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {details}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 0.5, ml: 1 }}>
              <Chip 
                label={placeType} 
                size="small" 
                variant="outlined"
                sx={{ height: 20, fontSize: '0.75rem' }}
              />
              {hasPolygon && (
                <Chip 
                  label="Fronteiras" 
                  size="small" 
                  color="primary"
                  sx={{ height: 20, fontSize: '0.75rem' }}
                />
              )}
            </Box>
          </Box>
        );
      }}
      PaperComponent={(props) => (
        <Paper {...props} elevation={8} sx={{ mt: 1 }} />
      )}
      noOptionsText={
        inputValue.length < 3 
          ? "Digite pelo menos 3 caracteres..." 
          : "Nenhuma localização encontrada"
      }
      loadingText="Buscando localizações..."
    />
  );
};

export default SearchBox;
