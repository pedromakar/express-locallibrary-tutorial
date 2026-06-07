MD Essential — Backend

Estrutura inicial criada para migrar o projeto antigo para uma base de e-commerce modular.

Rodar localmente:

1. Copie `.env.example` para `.env` e configure `MONGODB_URI` e `JWT_SECRET`.
2. Instale dependências:

```bash
cd backend
npm install
```

3. Rodar em modo dev:

```bash
npm run dev
```

Arquivos importantes:
- `server.js` — ponto de entrada
- `src/config/db.js` — conexão com MongoDB
- `src/models/product.js` — exemplo de model
- `src/controllers/productController.js` — exemplo de controller
- `src/routes/productRoutes.js` — rotas de produto
- `src/middlewares/auth.js` — middleware JWT
