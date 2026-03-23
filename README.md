# 💸 PicPay Backend Challenge

Implementação do desafio backend proposto pela PicPay, com foco em boas práticas de arquitetura, consistência de dados, integrações externas, testes automatizados e execução com Docker.

---

## 🚀 Tecnologias utilizadas

- Node.js
- TypeScript
- Fastify
- Prisma ORM
- SQLite
- Vitest
- Docker / Docker Compose

---

## 📦 Arquitetura

O projeto foi organizado com separação clara de responsabilidades:

- **Controller** → camada HTTP (entrada e saída)
- **Service** → regras de negócio
- **Repository** → acesso ao banco de dados
- **Gateway** → integrações externas (autorização e notificação)

Essa abordagem melhora:

- legibilidade
- manutenção
- testabilidade
- isolamento das integrações externas

---

## 📁 Estrutura do projeto

```text
src/
 ├── controllers/
 ├── services/
 ├── repositories/
 ├── gateways/
 ├── dtos/
 ├── errors/
 ├── lib/
 ├── routes/
 ├── generated/
 └── server.ts

prisma/
 ├── schema.prisma
 └── seed.ts

tests/
```

---

## ⚙️ Como rodar localmente

### 1. Clonar o repositório

```bash
git clone <URL_DO_REPO>
cd <NOME_DO_PROJETO>
```

### 2. Instalar dependências

```bash
npm install
```

### 3. Rodar migrations

```bash
npx prisma migrate dev
```

### 4. Popular banco com seed

```bash
npx prisma db seed
```

### 5. Rodar aplicação em desenvolvimento

```bash
npm run dev
```

Aplicação disponível em:

```text
http://localhost:3333
```

---

## 🐳 Como rodar com Docker

### Build da imagem

```bash
docker compose build
```

### Subir os containers

```bash
docker compose up -d
```

Aplicação disponível em:

```text
http://localhost:3333
```

### Ver logs

```bash
docker compose logs -f
```

### Derrubar ambiente

```bash
docker compose down
```

### Derrubar ambiente removendo volume do banco

```bash
docker compose down -v
```

> O volume é usado para persistir o arquivo SQLite entre reinicializações do container.

---

## ❤️ Health Check

### GET `/health`

Resposta esperada:

```json
{
  "status": "ok"
}
```

---

## 💸 Endpoint principal

### POST `/transfer`

Exemplo de payload:

```json
{
  "value": 100,
  "payer": 1,
  "payee": 2
}
```

Exemplo de sucesso:

```json
{
  "message": "Transferência realizada com sucesso.",
  "transfer": {
    "id": 1,
    "amount": 100,
    "payerId": 1,
    "payeeId": 2,
    "createdAt": "2026-01-01T00:00:00.000Z"
  }
}
```

---

## 📌 Regras de negócio implementadas

- Apenas usuários do tipo **COMMON** podem realizar transferências
- Usuários do tipo **MERCHANT** apenas recebem valores
- O pagador deve possuir saldo suficiente
- O pagador e o recebedor não podem ser a mesma pessoa
- A transferência precisa ser autorizada por serviço externo
- Após a conclusão da transferência, é feita tentativa de notificação externa

---

## 🔐 Consistência de dados

A operação de transferência é executada dentro de uma **transação do banco**, garantindo atomicidade para:

- débito do pagador
- crédito do recebedor
- registro da transferência

Isso evita inconsistência parcial em caso de falha no meio da operação.

---

## 🌐 Integrações externas

### Autorização

Antes da transação, a aplicação consulta um serviço externo de autorização.

A transferência só é executada se o retorno indicar autorização.

### Notificação

Após a transferência concluída, a aplicação tenta enviar uma notificação externa.

Falhas de notificação **não desfazem a transação financeira**, pois a consistência do saldo é tratada como prioridade do domínio.

---

## 🌱 Seed de desenvolvimento

O projeto possui seed idempotente com usuários iniciais para facilitar testes manuais.

Usuários esperados após o seed:

- João Silva → `COMMON`
- Maria Souza → `COMMON`
- Loja XPTO → `MERCHANT`

Se for necessário recriar tudo do zero:

```bash
npx prisma migrate reset
```

---

## 🧪 Testes automatizados

Executar:

```bash
npm test
```

Cobertura atual inclui cenários como:

- transferência válida
- pagador inexistente
- recebedor inexistente
- lojista tentando transferir
- saldo insuficiente
- transferência não autorizada

Os testes focam principalmente na **camada de service**, com uso de mocks para isolamento das dependências.

---

## 🧠 Decisões técnicas

- Uso de **transações do Prisma** para garantir consistência
- Separação por camadas para facilitar manutenção e testes
- Gateways para desacoplar integrações externas
- Mocks nos testes unitários para deixar a validação previsível e rápida
- Seed idempotente para facilitar desenvolvimento e repetição de cenários

---

## ⚠️ Limitações conhecidas

- Existe risco de **condição de corrida** em cenários de concorrência alta, já que duas transferências simultâneas podem ler o mesmo saldo antes da atualização
- Valores monetários ainda estão tratados com simplificação para o desafio; em ambiente produtivo, seria mais seguro trabalhar com **centavos inteiros** ou estratégia mais rígida de precisão
- Integrações externas ainda não possuem retry, fila ou fallback estruturado

---

## 🚀 Melhorias futuras

- Controle de concorrência mais robusto
- Fila para notificação assíncrona
- Retry para serviços externos
- Logging estruturado
- Observabilidade
- Autenticação e autorização
- PostgreSQL em vez de SQLite para ambiente produtivo
- CI/CD e pipeline de validação automática

---

## 🧑‍💻 Autor

Desenvolvido por **Diego Romanio de Almeida**

---

## 📄 Licença

Este projeto foi desenvolvido para fins de avaliação técnica.
