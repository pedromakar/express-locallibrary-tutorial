# MD Essential - Contexto do Projeto

## Sobre o projeto

A MD Essential é uma marca de roupas fitness que está sendo desenvolvida paralelamente a este projeto.

Este repositório contém o desenvolvimento do sistema de e-commerce da marca, criado como parte do Trabalho de Conclusão de Curso (TCC) do curso Técnico em Informática para Internet do Instituto Federal Catarinense (IFC) – Campus Sombrio.

O objetivo é desenvolver uma plataforma própria para gerenciamento da loja virtual, permitindo evolução contínua do sistema conforme as necessidades da marca.

---

# Objetivos do sistema

O sistema busca centralizar as principais operações da loja, oferecendo recursos para administração e utilização pelos clientes.

Atualmente o projeto contempla funcionalidades como:

- autenticação de usuários utilizando JWT;
- cadastro e gerenciamento de produtos;
- catálogo de produtos;
- carrinho de compras;
- gerenciamento de pedidos;
- gerenciamento de clientes;
- painel administrativo;
- controle de estoque;
- área do cliente.

Novas funcionalidades poderão ser adicionadas durante o desenvolvimento.

---

# Tecnologias utilizadas

## Backend

- Node.js
- Express

## Banco de Dados

- MongoDB (Mongoose)

## Frontend

O frontend é desenvolvido utilizando HTML, CSS e JavaScript puro (Vanilla JavaScript).

---

# Estrutura geral do sistema

O projeto está organizado principalmente no diretório `backend`, onde estão concentrados:

- servidor da aplicação;
- rotas da API;
- controllers;
- models;
- middlewares;
- configuração do banco de dados;
- arquivos públicos da interface.

A interface administrativa e a interface utilizada pelos clientes encontram-se na pasta `backend/public`.

---

# Organização do código

Durante o desenvolvimento do projeto devem ser priorizados:

- organização do código;
- reutilização de funções e componentes;
- facilidade de manutenção;
- clareza na estrutura das pastas;
- documentação sempre que necessário.

Sempre que possível:

- evitar duplicação de código;
- reutilizar funcionalidades existentes;
- manter um padrão de nomenclatura;
- preservar a arquitetura já utilizada pelo projeto.

---

# Interface

A identidade visual da MD Essential segue uma proposta minimalista e moderna.

Existe um template de referência para orientar a evolução da interface.

Além disso, alguns e-commerces são utilizados como inspiração para experiência do usuário, organização do catálogo e navegação, entre eles:

- Alpha Co
- Berserk

Essas referências servem apenas como inspiração para usabilidade e organização visual. O projeto deve manter identidade própria.

---

# Objetivo da documentação

Este documento serve para fornecer contexto aos desenvolvedores e assistentes de IA que contribuírem com o projeto.

Antes de realizar alterações significativas, recomenda-se compreender a estrutura existente e priorizar melhorias compatíveis com a arquitetura atual.

Ao sugerir modificações:

- preserve funcionalidades já implementadas;
- evite alterações desnecessárias na estrutura do projeto;
- explique o motivo de mudanças importantes;
- mantenha compatibilidade com o restante do sistema;
- priorize soluções simples, organizadas e de fácil manutenção.

---

# Observações

Este documento representa o estado atual do projeto e poderá ser atualizado conforme novas funcionalidades forem implementadas ou a arquitetura evoluir.
