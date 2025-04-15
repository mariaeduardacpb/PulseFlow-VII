# PulseFlow

## Estrutura de Diretórios

A estrutura do projeto é organizada da seguinte maneira:

### 📂 PulseFlow
O diretório principal do projeto.

#### 📁 client (Frontend)
Contém todos os arquivos necessários para o frontend do projeto.

- **📁 public**: Arquivos estáticos acessíveis diretamente pelo navegador.
  - **📁 css**: Arquivos de estilo CSS.
    - `style.css`: Arquivo de estilo principal do frontend.
  - **📁 js**: Arquivos JavaScript que controlam a interação no frontend.
    - `main.js`: Arquivo JavaScript principal, responsável pela lógica no frontend.
  - **📁 img**: Imagens usadas no site.

- **📁 views**: Páginas HTML do frontend.
  - `index.html`: Página inicial (Home).
  - `login.html`: Página de login.
  - `register.html`: Página de cadastro de usuário.
  - `verify-2fa.html`: Página para verificação de dois fatores (2FA).
  - `dashboard.html`: Página da área logada, acessível após autenticação.

- **📄 README.md**: Este arquivo contém informações sobre o projeto frontend, como instruções de configuração e execução.