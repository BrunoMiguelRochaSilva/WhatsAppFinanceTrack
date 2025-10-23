# WhatsAppFinanceTrack

WhatsAppFinanceTrack é uma plataforma web que transforma mensagens de WhatsApp em lançamentos financeiros organizados.

Os usuários podem enviar textos como **“Gastei 45,90 no mercado”** ou **“Recebi 1200 do salário”** e o robô interpreta, categoriza e registra automaticamente nas tabelas e gráficos do painel.

## 🧱 Estrutura do projeto

```
backend/   # API REST em Node.js (sem dependências externas) com armazenamento em JSON
frontend/  # Interface web responsiva (HTML + CSS + JS puros)
data/      # Banco de dados simples em arquivo JSON
```

## ⚙️ Como executar localmente

1. **Inicie o backend**
   ```bash
   cd backend
   node src/server.js
   ```
   O servidor ficará disponível em `http://localhost:4000`.

2. **Abra o frontend**
   - Sirva a pasta `frontend` com qualquer servidor estático (por exemplo, `python -m http.server 5173`).
   - Acesse `http://localhost:5173` no navegador.

> A aplicação foi desenhada para funcionar sem dependências externas. Todo o processamento de mensagens, autenticação e geração de dashboards é feito utilizando apenas bibliotecas nativas do Node e JavaScript.

## 💬 Como funciona o fluxo via WhatsApp

1. Crie uma conta e faça login na interface web.
2. Envie mensagens para o webhook (por meio da API do WhatsApp Business ou ferramentas de teste) no formato livre, por exemplo:
   - `Gastei 32,70 no Uber`
   - `Recebi 250,00 de freelance`
3. A API `/whatsapp/webhook` interpreta o valor, categoria e descrição.
4. O lançamento aparece em tempo real no dashboard, com resumo mensal, gráfico de categorias e histórico recente.

## 🔐 Autenticação

- Registro e login com email + senha.
- Hash de senha usando `pbkdf2` (nativo do Node).
- Tokens compatíveis com JWT gerados manualmente com HMAC-SHA256.

## 📊 Dashboard

- **Resumo mensal**: receitas, despesas e saldo do mês corrente.
- **Lançamento manual**: formulário para adicionar transações positivas (receitas) ou negativas (despesas).
- **Histórico recente**: tabela com as últimas movimentações e botão de exclusão.
- **Distribuição por categoria**: gráfico de barras responsivo construído com CSS/JS.

## 🚀 Próximos passos sugeridos

- Integrar de fato com a API do WhatsApp Business.
- Substituir o armazenamento em arquivo por um banco relacional (PostgreSQL).
- Adicionar suporte a upload de notas fiscais com OCR.
- Disponibilizar notificações automáticas de confirmação pelo WhatsApp.
