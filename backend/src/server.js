const http = require('http');
const { parseJson, sendJson, parseUrl } = require('./utils/http');
const { getStore, saveStore } = require('./utils/db');
const { hashPassword, verifyPassword, createToken, verifyToken } = require('./utils/auth');
const { parseWhatsAppMessage } = require('./utils/parser');

const PORT = process.env.PORT || 4000;

function handleCors(req, res) {
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
    });
    res.end();
    return true;
  }
  return false;
}

function authenticate(req) {
  const authHeader = req.headers['authorization'];
  if (!authHeader) return null;
  const [, token] = authHeader.split(' ');
  if (!token) return null;
  return verifyToken(token);
}

function handleRegister(req, res) {
  parseJson(req)
    .then(body => {
      const { name, email, password } = body;
      if (!name || !email || !password) {
        sendJson(res, 400, { error: 'Name, email and password are required' });
        return;
      }
      const store = getStore();
      if (store.users.some(user => user.email === email)) {
        sendJson(res, 409, { error: 'Email already registered' });
        return;
      }
      const user = {
        id: `user_${Date.now()}`,
        name,
        email,
        password: hashPassword(password),
        createdAt: new Date().toISOString(),
      };
      store.users.push(user);
      saveStore(store);
      sendJson(res, 201, { id: user.id, name: user.name, email: user.email });
    })
    .catch(err => {
      sendJson(res, 400, { error: 'Invalid JSON', details: err.message });
    });
}

function handleLogin(req, res) {
  parseJson(req)
    .then(body => {
      const { email, password } = body;
      if (!email || !password) {
        sendJson(res, 400, { error: 'Email and password are required' });
        return;
      }
      const store = getStore();
      const user = store.users.find(u => u.email === email);
      if (!user || !verifyPassword(password, user.password)) {
        sendJson(res, 401, { error: 'Invalid credentials' });
        return;
      }
      const token = createToken({ userId: user.id, email: user.email });
      sendJson(res, 200, { token, user: { id: user.id, name: user.name, email: user.email } });
    })
    .catch(err => sendJson(res, 400, { error: 'Invalid JSON', details: err.message }));
}

function requireAuth(req, res) {
  const user = authenticate(req);
  if (!user) {
    sendJson(res, 401, { error: 'Unauthorized' });
    return null;
  }
  return user;
}

function handleGetExpenses(req, res, user) {
  const store = getStore();
  const expenses = store.expenses.filter(exp => exp.userId === user.userId);
  sendJson(res, 200, { expenses });
}

function handleCreateExpense(req, res, user) {
  parseJson(req)
    .then(body => {
      const { amount, category = 'Other', description = '', date = new Date().toISOString(), source = 'manual' } = body;
      if (typeof amount !== 'number' || Number.isNaN(amount)) {
        sendJson(res, 400, { error: 'Amount must be a number' });
        return;
      }
      const store = getStore();
      const expense = {
        id: `exp_${Date.now()}`,
        userId: user.userId,
        amount,
        category,
        description,
        date,
        source,
        createdAt: new Date().toISOString(),
      };
      store.expenses.push(expense);
      saveStore(store);
      sendJson(res, 201, { expense });
    })
    .catch(err => sendJson(res, 400, { error: 'Invalid JSON', details: err.message }));
}

function handleUpdateExpense(req, res, user, expenseId) {
  parseJson(req)
    .then(body => {
      const store = getStore();
      const expense = store.expenses.find(exp => exp.id === expenseId && exp.userId === user.userId);
      if (!expense) {
        sendJson(res, 404, { error: 'Expense not found' });
        return;
      }
      const { amount, category, description, date } = body;
      if (amount !== undefined) {
        if (typeof amount !== 'number' || Number.isNaN(amount)) {
          sendJson(res, 400, { error: 'Amount must be a number' });
          return;
        }
        expense.amount = amount;
      }
      if (category) expense.category = category;
      if (description) expense.description = description;
      if (date) expense.date = date;
      saveStore(store);
      sendJson(res, 200, { expense });
    })
    .catch(err => sendJson(res, 400, { error: 'Invalid JSON', details: err.message }));
}

function handleDeleteExpense(res, user, expenseId) {
  const store = getStore();
  const index = store.expenses.findIndex(exp => exp.id === expenseId && exp.userId === user.userId);
  if (index === -1) {
    sendJson(res, 404, { error: 'Expense not found' });
    return;
  }
  store.expenses.splice(index, 1);
  saveStore(store);
  sendJson(res, 204, {});
}

function handleMonthlyReport(res, user) {
  const store = getStore();
  const expenses = store.expenses.filter(exp => exp.userId === user.userId);
  const summary = {};
  expenses.forEach(exp => {
    const monthKey = exp.date ? exp.date.slice(0, 7) : new Date(exp.createdAt).toISOString().slice(0, 7);
    if (!summary[monthKey]) {
      summary[monthKey] = { income: 0, expenses: 0, balance: 0 };
    }
    if (exp.amount >= 0) {
      summary[monthKey].income += exp.amount;
    } else {
      summary[monthKey].expenses += Math.abs(exp.amount);
    }
    summary[monthKey].balance = summary[monthKey].income - summary[monthKey].expenses;
  });
  sendJson(res, 200, { summary });
}

function handleWhatsAppWebhook(req, res) {
  parseJson(req)
    .then(body => {
      const { message = '', userId = null } = body;
      if (!message) {
        sendJson(res, 400, { error: 'Message is required' });
        return;
      }
      const store = getStore();
      const linkedUser = userId ? store.users.find(u => u.id === userId) : store.users[0];
      if (!linkedUser) {
        sendJson(res, 404, { error: 'No user linked to WhatsApp session' });
        return;
      }
      const parsed = parseWhatsAppMessage(message);
      if (typeof parsed.amount !== 'number') {
        sendJson(res, 200, { status: 'ignored', reason: 'Amount not detected' });
        return;
      }
      const expense = {
        id: `exp_${Date.now()}`,
        userId: linkedUser.id,
        amount: message.toLowerCase().includes('recebi') || parsed.amount < 0 ? parsed.amount : parsed.amount * -1,
        category: parsed.category,
        description: parsed.description,
        date: new Date().toISOString(),
        source: 'whatsapp',
        createdAt: new Date().toISOString(),
      };
      store.expenses.push(expense);
      saveStore(store);
      sendJson(res, 201, { status: 'recorded', expense });
    })
    .catch(err => sendJson(res, 400, { error: 'Invalid JSON', details: err.message }));
}

const server = http.createServer((req, res) => {
  if (handleCors(req, res)) return;
  const url = parseUrl(req.url);
  const path = url.pathname;

  if (req.method === 'POST' && path === '/auth/register') {
    handleRegister(req, res);
    return;
  }
  if (req.method === 'POST' && path === '/auth/login') {
    handleLogin(req, res);
    return;
  }
  if (req.method === 'POST' && path === '/whatsapp/webhook') {
    handleWhatsAppWebhook(req, res);
    return;
  }

  if (path.startsWith('/expenses')) {
    const user = requireAuth(req, res);
    if (!user) return;
    if (req.method === 'GET' && path === '/expenses') {
      handleGetExpenses(req, res, user);
      return;
    }
    if (req.method === 'POST' && path === '/expenses') {
      handleCreateExpense(req, res, user);
      return;
    }
    if (req.method === 'PUT') {
      const expenseId = path.split('/')[2];
      handleUpdateExpense(req, res, user, expenseId);
      return;
    }
    if (req.method === 'DELETE') {
      const expenseId = path.split('/')[2];
      handleDeleteExpense(res, user, expenseId);
      return;
    }
  }

  if (req.method === 'GET' && path === '/reports/monthly') {
    const user = requireAuth(req, res);
    if (!user) return;
    handleMonthlyReport(res, user);
    return;
  }

  sendJson(res, 404, { error: 'Not found' });
});

server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
