📂 PulseFlow
├── 📁 server                            # Backend (Node.js + Express)
│   ├── 📁 config                        # Configurações globais
│   │   └── db.js                       # Conexão MongoDB
│   ├── 📁 controllers                   # Lógica das rotas
│   │   └── authController.js
│   ├── 📁 models                        # Modelos do MongoDB
│   │   └── User.js
│   ├── 📁 routes                        # Rotas Express
│   │   └── authRoutes.js
│   ├── 📁 middlewares                  # Autenticação, validações, etc.
│   │   └── authMiddleware.js
│   ├── 📁 services                     # Lógica extra (envio de e-mail, OTP, etc)
│   │   ├── emailService.js
│   │   ├── otpService.js
│   │   └── tokenService.js
│   ├── 📁 utils                        # Helpers reutilizáveis
│   │   └── validators.js
│   ├── 📄 app.js                       # App Express (configuração)
│   ├── 📄 server.js                    # Inicialização do servidor
│   └── 📄 README.md                    # Instruções do backend
│
├── 📄 .env                              # Variáveis de ambiente
├── 📄 .gitignore
├── 📄 package.json
└── 📄 README.md                         # Instruções gerais do projeto