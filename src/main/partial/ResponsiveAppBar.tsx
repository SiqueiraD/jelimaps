import React from "react";
import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Toolbar from "@mui/material/Toolbar";
import { IconButton, Typography, Menu, Avatar, Tooltip } from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import Container from "@mui/material/Container";
import Button from "@mui/material/Button";
import MenuItem from "@mui/material/MenuItem";
import { Public, AccountCircle } from "@mui/icons-material";
import { useRouter } from "next/router";
import useCaixaDialogo from "@/components/CaixaDialogo/useCaixaDialogo";
import { signIn, signOut, useSession } from "next-auth/react";

const pages = [
  { text: "Home", href: "/" },
  { text: "Sobre", href: "/about" },
  { text: "Studio", href: "/mapa" },
];

interface Page {
  text: string;
  href: string;
}

const ResponsiveAppBar: React.FC = () => {
  const router = useRouter();
  const { data: session, status } = useSession();
  const Logo = "JeliMaps";
  const [anchorElNav, setAnchorElNav] = React.useState<null | HTMLElement>(null);
  const [anchorElUser, setAnchorElUser] = React.useState<null | HTMLElement>(null);
  const { openModalConfirm } = useCaixaDialogo();
  const loading = status === 'loading';

  const handleOpenNavMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorElNav(event.currentTarget);
  };

  const handleCloseUserMenu = () => {
    setAnchorElNav(null);
  };

  const handleOpenUserMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorElUser(event.currentTarget);
  };

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/' });
    handleCloseUserMenu();
  };

  const handleRouter = (path: string) => {
    path == "/mapa" && localStorage.getItem("mapaContext")
      ? openModalConfirm({
          title: "Você tem um projeto em andamento",
          message: "Deseja continuar ou começar do zero?",
          onConfirm: () => {
            router.push("/mapa/novo");
          },
          onCancel: () => {
            router.push("/mapa");
          },
          cancelarTitle: "Continuar um projeto",
          confirmarTitle: "Começar um novo",
        })
      : router.push(path);
    handleCloseUserMenu();
  };

  return (
    <AppBar position="static">
      <Container maxWidth="xl">
        <Toolbar disableGutters sx={{ justifyContent: 'space-between' }}>
          <Public sx={{ display: { xs: "none", md: "flex" }, mr: 1 }} />
          <Typography
            variant="h6"
            noWrap
            component="a"
            onClick={() => router.push("/")}
            sx={{
              mr: 2,
              display: { xs: "none", md: "flex" },
              fontFamily: "monospace",
              fontWeight: 700,
              letterSpacing: ".3rem",
              color: "inherit",
              textDecoration: "none",
              cursor: "pointer",
            }}
          >
            {Logo}
          </Typography>

          <Box sx={{ flexGrow: 1, display: { xs: 'none', md: 'flex' } }}>
            {pages.map((page: Page) => (
              <Button
                key={page.text}
                onClick={() => handleRouter(page.href)}
                sx={{ my: 2, color: 'white', display: 'block' }}
              >
                {page.text}
              </Button>
            ))}
          </Box>

          <Box sx={{ flexGrow: 0, ml: 2 }}>
            {!loading && (
              <>
                {session ? (
                  <>
                    <Tooltip title="Abrir configurações">
                      <IconButton onClick={handleOpenUserMenu} sx={{ p: 0 }}>
                        {session.user?.image ? (
                          <Avatar 
                            alt={session.user.name || 'Usuário'} 
                            src={session.user.image} 
                            sx={{ width: 40, height: 40 }}
                          />
                        ) : (
                          <Avatar sx={{ bgcolor: 'primary.main', width: 40, height: 40 }}>
                            <AccountCircle />
                          </Avatar>
                        )}
                      </IconButton>
                    </Tooltip>
                    <Menu
                      sx={{ mt: '45px' }}
                      id="menu-appbar"
                      anchorEl={anchorElUser}
                      anchorOrigin={{
                        vertical: 'top',
                        horizontal: 'right',
                      }}
                      keepMounted
                      transformOrigin={{
                        vertical: 'top',
                        horizontal: 'right',
                      }}
                      open={Boolean(anchorElUser)}
                      onClose={handleCloseUserMenu}
                    >
                      <MenuItem onClick={() => handleRouter("/perfil")}>
                        <Typography textAlign="center">Perfil</Typography>
                      </MenuItem>
                      <MenuItem onClick={handleSignOut}>
                        <Typography textAlign="center">Sair</Typography>
                      </MenuItem>
                    </Menu>
                  </>
                ) : (
                  <Button 
                    color="inherit" 
                    onClick={() => signIn('google')}
                    sx={{ ml: 2 }}
                  >
                    Entrar
                  </Button>
                )}
              </>
            )}
          </Box>

          <Box sx={{ flexGrow: 1, display: { xs: "flex", md: "none" } }}>
            <IconButton
              size="large"
              aria-label="account of current user"
              aria-controls="menu-appbar"
              aria-haspopup="true"
              onClick={handleOpenNavMenu}
              color="inherit"
              sx={{ mr: 1 }}
            >
              <MenuIcon />
            </IconButton>
            <Menu
              id="menu-appbar"
              anchorEl={anchorElNav}
              anchorOrigin={{
                vertical: "bottom",
                horizontal: "left",
              }}
              keepMounted
              transformOrigin={{
                vertical: "top",
                horizontal: "left",
              }}
              open={Boolean(anchorElNav)}
              onClose={handleCloseUserMenu}
              sx={{
                display: { xs: "block", md: "none" },
              }}
            >
              {pages.map((page) => (
                <MenuItem
                  key={page.text}
                  onClick={() => {
                    handleRouter(page.href);
                  }}
                >
                  <Typography textAlign="center">{page.text}</Typography>
                </MenuItem>
              ))}
            </Menu>
          </Box>
          <Public sx={{ display: { xs: "flex", md: "none" }, mr: 1 }} />
          <Typography
            variant="h5"
            noWrap
            component="a"
            onClick={() => router.push("/")}
            sx={{
              mr: 2,
              display: { xs: "flex", md: "none" },
              flexGrow: 1,
              fontFamily: "monospace",
              fontWeight: 700,
              letterSpacing: ".3rem",
              color: "inherit",
              textDecoration: "none",
              cursor: "pointer",
            }}
          >
            {Logo}
          </Typography>
        </Toolbar>
      </Container>
    </AppBar>
  );
}
export default ResponsiveAppBar;
