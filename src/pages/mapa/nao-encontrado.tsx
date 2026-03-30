import React from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import SearchOffIcon from "@mui/icons-material/SearchOff";
import { useRouter } from "next/router";
import DefaultTemplate from "@/main/template/DefaultTemplate";

export default function MapaNaoEncontrado() {
  const router = useRouter();

  return (
    <DefaultTemplate>
      <Container maxWidth="sm">
        <Box
          display="flex"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          minHeight="70vh"
          gap={3}
          textAlign="center"
        >
          <SearchOffIcon sx={{ fontSize: 80, color: "text.secondary" }} />

          <Typography variant="h4" fontWeight="bold">
            Mapa não encontrado
          </Typography>

          <Typography variant="body1" color="text.secondary">
            O mapa que você está tentando acessar não existe ou foi removido.
            Verifique o link e tente novamente.
          </Typography>

          <Box display="flex" gap={2} flexWrap="wrap" justifyContent="center">
            <Button variant="outlined" onClick={() => router.push("/")}>
              Ir para a página inicial
            </Button>
            <Button variant="contained" onClick={() => router.push("/mapa/meus-mapas")}>
              Meus Mapas
            </Button>
          </Box>
        </Box>
      </Container>
    </DefaultTemplate>
  );
}
