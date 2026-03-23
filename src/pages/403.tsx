import React from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import { useRouter } from "next/router";
import DefaultTemplate from "@/main/template/DefaultTemplate";
import { signIn, useSession } from "next-auth/react";

export default function AcessoNegado() {
  const router = useRouter();
  const { status } = useSession();

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
          <LockOutlinedIcon sx={{ fontSize: 80, color: "text.secondary" }} />

          <Typography variant="h4" fontWeight="bold">
            Acesso não permitido
          </Typography>

          <Typography variant="body1" color="text.secondary">
            Este mapa é privado e você não tem permissão para visualizá-lo.
            Somente o dono do mapa ou pessoas com quem ele foi compartilhado
            podem acessar este conteúdo.
          </Typography>

          {status === "unauthenticated" && (
            <Typography variant="body2" color="text.secondary">
              Talvez você precise fazer login para acessar este mapa.
            </Typography>
          )}

          <Box display="flex" gap={2} flexWrap="wrap" justifyContent="center">
            <Button variant="outlined" onClick={() => router.push("/")}>
              Ir para a página inicial
            </Button>
            {status === "unauthenticated" && (
              <Button
                variant="contained"
                onClick={() => signIn("google")}
              >
                Entrar com Google
              </Button>
            )}
            {status === "authenticated" && (
              <Button
                variant="contained"
                onClick={() => router.push("/mapa/meus-mapas")}
              >
                Ver meus mapas
              </Button>
            )}
          </Box>
        </Box>
      </Container>
    </DefaultTemplate>
  );
}
