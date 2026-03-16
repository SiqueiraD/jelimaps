# Sistema de Design - JeliMaps

## 📋 Visão Geral

Este documento define os padrões de design e desenvolvimento para a UI/UX da aplicação JeliMaps. O objetivo é garantir consistência visual e facilitar a manutenção do código.

## 🎨 Design Tokens

### Cores

Todas as cores devem ser importadas de `@/styles/theme/colors`:

```typescript
import { colors } from '@/styles/theme';

// Uso
colors.primary.main       // #1976d2
colors.primary.light      // #42a5f5
colors.primary.dark       // #1565c0
colors.text.primary       // rgba(0, 0, 0, 0.87)
```

#### Paleta Principal

- **Primary**: Azul (#1976d2) - Ações principais e elementos de destaque
- **Secondary**: Vermelho (#dc004e) - Ações secundárias
- **Error**: Vermelho (#f44336) - Estados de erro
- **Warning**: Laranja (#ff9800) - Avisos
- **Success**: Verde (#4caf50) - Confirmações e sucessos
- **Info**: Azul claro (#2196f3) - Informações

### Espaçamento

Sistema baseado em múltiplos de 4px:

```typescript
import { spacing } from '@/styles/theme';

spacing.xxs  // 4px
spacing.xs   // 8px
spacing.sm   // 12px
spacing.md   // 16px
spacing.lg   // 24px
spacing.xl   // 32px
spacing.xxl  // 40px
spacing.xxxl // 48px
```

### Tipografia

```typescript
import { typography, textStyles } from '@/styles/theme';

// Tamanhos
typography.fontSize.xs    // 12px
typography.fontSize.sm    // 14px
typography.fontSize.base  // 16px
typography.fontSize.lg    // 18px
typography.fontSize.xl    // 20px

// Pesos
typography.fontWeight.regular  // 400
typography.fontWeight.medium   // 500
typography.fontWeight.bold     // 700

// Estilos pré-definidos
textStyles.h1     // Título principal
textStyles.body1  // Texto do corpo
textStyles.button // Texto de botão
```

## 🧩 Componentes

### Componentes Base

Localizados em `src/components/ui/`:

#### Button
```tsx
import { Button } from '@/components/ui';

<Button 
  variant="contained"  // contained | outlined | text
  color="primary"      // primary | secondary | error | warning | success
  size="medium"        // small | medium | large
  loading={false}      // Mostra indicador de carregamento
  fullWidth={false}    // Ocupa largura total
>
  Clique Aqui
</Button>
```

#### Input
```tsx
import { Input } from '@/components/ui';

<Input 
  label="Nome"
  placeholder="Digite seu nome"
  size="small"         // small | medium
  fullWidth={true}
  startIcon={<Icon />} // Ícone no início
  endIcon={<Icon />}   // Ícone no final
/>
```

#### Card
```tsx
import { Card } from '@/components/ui';

<Card
  title="Título do Card"
  subtitle="Subtítulo opcional"
  hoverable={true}     // Efeito hover
  noPadding={false}    // Remove padding interno
  actions={<Button>Ação</Button>}
>
  Conteúdo do card
</Card>
```

#### Container
```tsx
import { Container } from '@/components/ui';

<Container
  variant="section"    // default | section | card | form
  centered={false}     // Centraliza conteúdo
  fullHeight={false}   // Altura total da viewport
  noPadding={false}    // Remove padding
>
  Conteúdo
</Container>
```

## 🎯 Padrões de Uso

### 1. Estilização

#### ❌ Evitar:
```tsx
// Cores hardcoded
<div style={{ color: '#1976d2' }}>

// Espaçamentos arbitrários
<div style={{ margin: '15px' }}>

// Múltiplos sistemas de estilo
<div className="m-4" sx={{ p: 2 }} style={{ padding: '10px' }}>
```

#### ✅ Preferir:
```tsx
// Usar tokens
import { colors, spacing } from '@/styles/theme';

<Box sx={{ 
  color: colors.primary.main,
  padding: spacing.md 
}}>

// Ou componentes padronizados
<Container variant="section">
  <Card title="Exemplo">
    Conteúdo
  </Card>
</Container>
```

### 2. Responsividade

Use o hook `useBreakpoint`:

```tsx
import { useBreakpoint } from '@/hooks/useBreakpoint';

function Component() {
  const { isMobile, isTablet, isDesktop } = useBreakpoint();
  
  return (
    <Container>
      {isMobile && <MobileView />}
      {isTablet && <TabletView />}
      {isDesktop && <DesktopView />}
    </Container>
  );
}
```

### 3. Tema

Use o hook `useTheme` para acessar o tema:

```tsx
import { useTheme } from '@/hooks/useTheme';

function Component() {
  const { colors, spacing, getSpacing } = useTheme();
  
  return (
    <Box sx={{
      backgroundColor: colors.background.paper,
      padding: getSpacing(2), // 16px (2 * 8)
    }}>
      Conteúdo
    </Box>
  );
}
```

## 📁 Estrutura de Arquivos

```
src/
├── components/
│   ├── ui/                 # Componentes base reutilizáveis
│   │   ├── Button/
│   │   ├── Card/
│   │   ├── Input/
│   │   └── Container/
│   └── ...                  # Componentes específicos da aplicação
├── styles/
│   ├── theme/               # Design tokens
│   │   ├── colors.ts
│   │   ├── spacing.ts
│   │   ├── typography.ts
│   │   ├── shadows.ts
│   │   ├── breakpoints.ts
│   │   └── index.ts
│   ├── components/          # Estilos específicos
│   │   ├── leaflet.css
│   │   └── studio.css
│   ├── globals.css          # Estilos globais
│   └── muiTheme.ts          # Tema do Material-UI
└── hooks/
    ├── useTheme.ts          # Hook do tema
    └── useBreakpoint.ts     # Hook de responsividade
```

## 🔄 Migração

### Componentes Existentes

Para migrar componentes existentes:

1. **Substituir cores hardcoded** pelos tokens de `colors`
2. **Padronizar espaçamentos** usando `spacing`
3. **Usar componentes UI** em vez de componentes MUI diretos quando possível
4. **Aplicar hooks** para responsividade e tema

### Exemplo de Migração

#### Antes:
```tsx
<Button 
  variant="contained" 
  sx={{ bgcolor: '#1976d2', my: 1, mr: 1 }}
>
  Salvar
</Button>
```

#### Depois:
```tsx
import { Button } from '@/components/ui';

<Button variant="contained" color="primary">
  Salvar
</Button>
```

## 🚀 Boas Práticas

1. **Consistência**: Use sempre os mesmos padrões em toda a aplicação
2. **Reutilização**: Crie componentes reutilizáveis antes de duplicar código
3. **Documentação**: Documente componentes complexos com JSDoc
4. **Testes**: Teste componentes em diferentes tamanhos de tela
5. **Performance**: Use lazy loading para componentes pesados
6. **Acessibilidade**: Sempre inclua labels, alt texts e ARIA attributes

## 📝 Checklist de Revisão

Antes de fazer commit de mudanças na UI:

- [ ] Cores vêm dos tokens de design?
- [ ] Espaçamentos seguem o sistema de 4px?
- [ ] Componente é responsivo?
- [ ] Existe componente similar que pode ser reutilizado?
- [ ] Código está documentado?
- [ ] Funciona em modo claro e escuro?
- [ ] Acessibilidade foi considerada?

## 🆘 Suporte

Em caso de dúvidas sobre padrões de UI/UX:

1. Consulte este documento
2. Verifique componentes existentes em `src/components/ui`
3. Use os tokens de design em `src/styles/theme`
4. Mantenha consistência com o resto da aplicação
