const API_BASE = window.location.hostname === 'localhost' ? 'http://localhost:4000' : 'http://127.0.0.1:4000';

const authSection = document.getElementById('authSection');
const dashboardSection = document.getElementById('dashboard');
const authForm = document.getElementById('authForm');
const expenseForm = document.getElementById('expenseForm');
const authMessage = document.getElementById('authMessage');
const expenseMessage = document.getElementById('expenseMessage');
const logoutBtn = document.getElementById('logoutBtn');
const registerBtn = document.getElementById('registerBtn');

const summaryCardsContainer = document.getElementById('summaryCards');
const expenseTableBody = document.querySelector('#expenseTable tbody');
const categoryChart = document.getElementById('categoryChart');
const summaryTemplate = document.getElementById('summaryCardTemplate');

let authToken = localStorage.getItem('authToken') || null;
let currentUser = localStorage.getItem('currentUser')
  ? JSON.parse(localStorage.getItem('currentUser'))
  : null;

function setAuthState(token, user) {
  authToken = token;
  currentUser = user;
  if (token) {
    localStorage.setItem('authToken', token);
    localStorage.setItem('currentUser', JSON.stringify(user));
  } else {
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
  }
  updateUI();
}

function updateUI() {
  if (authToken && currentUser) {
    authSection.classList.add('hidden');
    dashboardSection.classList.remove('hidden');
    logoutBtn.classList.remove('hidden');
    loadDashboard();
  } else {
    authSection.classList.remove('hidden');
    dashboardSection.classList.add('hidden');
    logoutBtn.classList.add('hidden');
  }
}

async function request(endpoint, options = {}) {
  const headers = Object.assign({ 'Content-Type': 'application/json' }, options.headers || {});
  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });
  const contentType = response.headers.get('Content-Type');
  const data = contentType && contentType.includes('application/json') ? await response.json() : {};
  if (!response.ok) {
    throw new Error(data.error || 'Erro desconhecido');
  }
  return data;
}

authForm.addEventListener('submit', async event => {
  event.preventDefault();
  const email = document.getElementById('emailInput').value.trim();
  const password = document.getElementById('passwordInput').value.trim();
  authMessage.textContent = '';
  authMessage.classList.remove('error', 'success');

  try {
    const data = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    setAuthState(data.token, data.user);
    authMessage.textContent = 'Login realizado com sucesso!';
    authMessage.classList.add('success');
  } catch (error) {
    authMessage.textContent = error.message;
    authMessage.classList.add('error');
  }
});

registerBtn.addEventListener('click', async () => {
  const name = document.getElementById('nameInput').value.trim();
  const email = document.getElementById('emailInput').value.trim();
  const password = document.getElementById('passwordInput').value.trim();
  authMessage.textContent = '';
  authMessage.classList.remove('error', 'success');

  try {
    await request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    });
    authMessage.textContent = 'Conta criada! Agora faça login.';
    authMessage.classList.add('success');
  } catch (error) {
    authMessage.textContent = error.message;
    authMessage.classList.add('error');
  }
});

logoutBtn.addEventListener('click', () => {
  setAuthState(null, null);
});

expenseForm.addEventListener('submit', async event => {
  event.preventDefault();
  const description = document.getElementById('descriptionInput').value.trim();
  const amount = parseFloat(document.getElementById('amountInput').value);
  const category = document.getElementById('categoryInput').value.trim();
  const date = document.getElementById('dateInput').value;
  expenseMessage.textContent = '';
  expenseMessage.classList.remove('error', 'success');

  try {
    await request('/expenses', {
      method: 'POST',
      body: JSON.stringify({ description, amount, category, date }),
    });
    expenseMessage.textContent = 'Lançamento salvo com sucesso!';
    expenseMessage.classList.add('success');
    expenseForm.reset();
    loadDashboard();
  } catch (error) {
    expenseMessage.textContent = error.message;
    expenseMessage.classList.add('error');
  }
});

async function loadDashboard() {
  try {
    const expensesResponse = await request('/expenses');
    const reportResponse = await request('/reports/monthly');
    renderExpenses(expensesResponse.expenses || []);
    renderSummary(reportResponse.summary || {});
    renderCategoryChart(expensesResponse.expenses || []);
  } catch (error) {
    console.error('Erro ao carregar dashboard', error);
  }
}

function formatCurrency(value) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function renderExpenses(expenses) {
  expenseTableBody.innerHTML = '';
  const sorted = [...expenses].sort((a, b) => new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt));
  if (!sorted.length) {
    const row = document.createElement('tr');
    const cell = document.createElement('td');
    cell.colSpan = 5;
    cell.textContent = 'Nenhum lançamento encontrado ainda.';
    row.appendChild(cell);
    expenseTableBody.appendChild(row);
    return;
  }
  sorted.slice(0, 10).forEach(expense => {
    const row = document.createElement('tr');
    const dateCell = document.createElement('td');
    dateCell.textContent = expense.date ? new Date(expense.date).toLocaleDateString('pt-BR') : '';
    const descriptionCell = document.createElement('td');
    descriptionCell.textContent = expense.description || '-';
    const categoryCell = document.createElement('td');
    categoryCell.textContent = expense.category || 'Outro';
    const amountCell = document.createElement('td');
    amountCell.className = 'amount-col';
    amountCell.textContent = formatCurrency(expense.amount);
    const actionCell = document.createElement('td');
    const deleteButton = document.createElement('button');
    deleteButton.textContent = 'Excluir';
    deleteButton.addEventListener('click', async () => {
      if (confirm('Deseja remover este lançamento?')) {
        try {
          await request(`/expenses/${expense.id}`, { method: 'DELETE' });
          loadDashboard();
        } catch (error) {
          alert(error.message);
        }
      }
    });
    actionCell.appendChild(deleteButton);
    row.appendChild(dateCell);
    row.appendChild(descriptionCell);
    row.appendChild(categoryCell);
    row.appendChild(amountCell);
    row.appendChild(actionCell);
    expenseTableBody.appendChild(row);
  });
}

function renderSummary(summary) {
  summaryCardsContainer.innerHTML = '';
  const now = new Date();
  const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const current = summary[monthKey] || { income: 0, expenses: 0, balance: 0 };
  const cards = [
    { title: 'Receitas', value: current.income, meta: 'Total de entradas' },
    { title: 'Despesas', value: current.expenses, meta: 'Total de saídas' },
    { title: 'Saldo', value: current.balance, meta: 'Receitas - Despesas' },
  ];
  cards.forEach(card => {
    const node = summaryTemplate.content.firstElementChild.cloneNode(true);
    node.querySelector('h4').textContent = card.title;
    node.querySelector('.value').textContent = formatCurrency(card.value);
    node.querySelector('.meta').textContent = card.meta;
    summaryCardsContainer.appendChild(node);
  });
}

function renderCategoryChart(expenses) {
  categoryChart.innerHTML = '';
  if (!expenses.length) {
    categoryChart.textContent = 'Sem dados para exibir ainda.';
    return;
  }
  const totals = expenses.reduce((acc, exp) => {
    const key = exp.category || 'Outro';
    acc[key] = (acc[key] || 0) + exp.amount;
    return acc;
  }, {});
  const maxValue = Math.max(...Object.values(totals).map(Math.abs));
  Object.entries(totals).forEach(([category, value]) => {
    const bar = document.createElement('div');
    bar.className = 'chart-bar';
    const height = maxValue ? Math.round((Math.abs(value) / maxValue) * 100) : 0;
    bar.style.height = `${Math.max(height, 10)}%`;
    bar.dataset.label = category;
    const valueLabel = document.createElement('span');
    valueLabel.className = 'chart-value';
    valueLabel.textContent = formatCurrency(value);
    bar.appendChild(valueLabel);
    categoryChart.appendChild(bar);
  });
}

updateUI();
