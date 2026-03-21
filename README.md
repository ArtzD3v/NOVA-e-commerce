# Nova Store - Frontend E-commerce 🛍️

Um projeto de E-commerce limpo, moderno e completamente funcional construído usando **HTML5, CSS3 Nativo (Vanilla) e JavaScript puro**, focado em alta performance e Design Premium.

O projeto foi projetado para rodar perfeitamente apenas no lado do cliente (Front-end), utilizando a API nativa do navegador (`LocalStorage`) como motor de banco de dados para armazenar o carrinho, sessão do usuário e os produtos.

## ✨ Funcionalidades

- **Design Responsivo & Glassmorphism:** Layout impecável tanto em celulares quanto no desktop, usando temas escuros com efeitos de vidro fosco.
- **Catálogo de Produtos Dinâmico:** Listagem com grid interativo, e filtros instantâneos por categoria, faixa de preço, ordenação e barra de pesquisa inteligente.
- **Página de Detalhes Completa:** Galeria de imagens, avaliações em estrelas, seleção de quantidade e cálculo automático de preço.
- **Carrinho de Compras Interativo:** Motor de cálculo automático de frete grátis e cálculo de descontos totais com feedback visual.
- **Simulação Avançada de Checkout e Login:** Abas para Login e Registro simulando perfeitamente a sessão e telas adaptáveis de checkout passo a passo.
- **100% Client-Side:** Não é necessário instalar Node.js, PHP, bancos de dados ou qualquer ambiente de servidor complexo. Tudo funciona simulado no navegador!

## 🛠 Tecnologias Utilizadas

- **HTML5** (Web semântica e acessibilidade)
- **CSS3** (CSS Vanilla construído baseado em um Design System parecido com Tailwind, usando flexbox, grid, variáveis, clamp, keyframes e line-clamp)
- **JavaScript ES6+** (Módulos dinâmicos para gerenciar DOM e Lógica sem frameworks como React)
- **LocalStorage API** (Simulação de um banco de dados real com persistência completa)

## 📁 Estrutura do Projeto

```text
E-commerce/
│
└── client/
    ├── index.html            # Página Inicial (Hero, Destaques)
    ├── products.html         # Catálogo com filtros avançados
    ├── product-detail.html   # Galeria e detalhes do item
    ├── cart.html             # Resumo dinâmico do carrinho
    ├── checkout.html         # Simulação de finalização de compra
    ├── login.html            # Painel com efeito tab de Entrar/Cadastrar
    │
    ├── css/
    │   └── styles.css        # Core total do Design e Animações
    │
    └── js/
        ├── api.js            # Mock API + Banco de dados local (LocalStorage)
        ├── app.js            # Lógica central da loja (Carrinho, Notificações, Filtros)
        └── auth.js           # Lógica para alternância visual de Registro/Login
```

## 🚀 Como Executar Localmente

Sendo uma aplicação estática, rodar essa loja no seu computador é extremamente simples:

### Opção 1: Direto no Navegador
Dois cliques no arquivo `index.html` da pasta `/client` e a aplicação já estará rodando em funcionamento total no momento.

### Opção 2: Servidor Local Básico
Para uma experiência mais polida (evitando as restrições CORS estritas de leitura de arquivos `file://`), aconselha-se subir um servidor local rápido (como Live Server do VSCode) ou via terminal:
1. Abra o terminal na pasta `client`
2. Digite se tiver Python instalado:
   ```bash
   python -m http.server 8000
   ```
3. Acesse em seu navegador: `http://localhost:8000`

---
*Feito com foco no melhor UI/UX e alto desempenho para o Mundo Web.*
