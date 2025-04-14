# PulseFlow - Backend

## Estrutura de Diretórios

📂 `PulseFlow`  
├── 📁 **server** — Backend do projeto  
│  
│ ├── 📁 **config**  
│ │   └── `db.js` — Arquivo de configuração para conexão com o MongoDB.  
│  
│ ├── 📁 **controllers**  
│ │   └── `authController.js` — Controlador que lida com as requisições de autenticação.  
│  
│ ├── 📁 **models**  
│ │   └── `User.js` — Modelo de usuário com Mongoose.  
│  
│ ├── 📁 **routes**  
│ │   └── `authRoutes.js` — Rotas relacionadas à autenticação.  
│  
│ ├── 📁 **middlewares**  
│ │   └── `authMiddleware.js` — Middleware de autenticação e validação.  
│  
│ ├── 📁 **services**  
│ │   ├── `emailService.js` — Serviço para envio de e-mails.  
│ │   ├── `otpService.js` — Serviço para geração e verificação de OTPs.  
│ │   └── `tokenService.js` — Serviço para geração e verificação de tokens.  
│  
│ ├── 📁 **utils**  
│ │   └── `validators.js` — Funções auxiliares e validações reutilizáveis.  
│  
│ ├── `app.js` — Configuração e inicialização do app Express.  
│ ├── `server.js` — Arquivo principal de inicialização do servidor.  
│ └── `README.md` — Instruções do backend.  
│  
├── `.env` — Arquivo de variáveis de ambiente (não deve ser versionado).  
├── `.gitignore` — Arquivos e pastas ignoradas pelo Git.  
├── `package.json` — Dependências e scripts do projeto.  
└── `README.md` — Instruções gerais do projeto.

---

## Como Rodar o Backend

### Pré-requisitos

- [Node.js](https://nodejs.org)
- [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) ou local
- Um editor de código como o [VS Code](https://code.visualstudio.com)

