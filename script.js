document.addEventListener('DOMContentLoaded', async () => {
  const PASSWORD = '3088';
  const loginScreen = document.getElementById('login-screen');
  const passwordInput = document.getElementById('password-input');
  const passwordSubmit = document.getElementById('password-submit');
  const app = document.getElementById('app');
  const floorSelect = document.getElementById('floor-select');
  const employeeSelect = document.getElementById('employee-select');
  const addEmployeeBtn = document.getElementById('add-employee');
  const storeSelect = document.getElementById('store-select');
  const drinkSelect = document.getElementById('drink-select');
  const toppingsSelect = document.getElementById('toppings-select');
  const addOrderBtn = document.getElementById('add-order');
  const clearOrdersBtn = document.getElementById('clear-orders');
  const ordersTbody = document.querySelector('#orders-table tbody');
  const totalLabel = document.getElementById('total-label');
  const contactSelect = document.getElementById('contact-select');
  const exportTextBtn = document.getElementById('export-text');
  const exportMdBtn = document.getElementById('export-md');
  const outputArea = document.getElementById('output-area');
  const langSelect = document.getElementById('lang-select');

  // Load data
  let menus = await fetch('data/menus.json').then(res => res.json());
  let employees = await fetch('data/employees.json').then(res => res.json());
  let contacts = await fetch('data/contacts.json').then(res => res.json());
  let langZh = await fetch('lang/zh.json').then(res => res.json());
  let langVi = await fetch('lang/vi.json').then(res => res.json());

  let currentLang = localStorage.getItem('lang') || 'zh';
  langSelect.value = currentLang;

  let orders = [];

  function t(key) {
    return currentLang === 'vi' ? (langVi[key] || key) : (langZh[key] || key);
  }

  function populateFloors() {
    const floors = [...new Set(employees.map(e => e.floor))].sort();
    floorSelect.innerHTML = floors.map(f => `<option value="${f}">${f}</option>`).join('');
    filterEmployees();
  }

  function filterEmployees() {
    const f = floorSelect.value;
    employeeSelect.innerHTML = employees.filter(e => e.floor === f)
      .map(e => `<option value="${e.name}">${e.name}</option>`).join('');
  }

  function populateStores() {
    storeSelect.innerHTML = Object.keys(menus)
      .map(s => `<option value="${s}">${s}</option>`).join('');
    filterMenu();
  }

  function filterMenu() {
    const s = storeSelect.value;
    const items = menus[s] || [];
    drinkSelect.innerHTML = items.map(d => `<option value="${d.name}|${d.price}">${d.name} ($${d.price})</option>`).join('');
    populateToppings();
  }

  function populateToppings() {
    const s = storeSelect.value;
    const items = menus[s] || [];
    const some = items.find(d => d.toppings);
    toppingsSelect.innerHTML = (some ? some.toppings : []).map(t => `<option value="${t.name}|${t.price}">${t.name} (+$${t.price})</option>`).join('');
  }

  function populateContacts() {
    contactSelect.innerHTML = contacts.map(c => `<option value="${c.name} ${c.phone}">${c.name} ${c.phone}</option>`).join('');
  }

  function renderOrders() {
    ordersTbody.innerHTML = '';
    orders.sort((a, b) => a.floor.localeCompare(b.floor))
      .forEach(o => {
        const row = document.createElement('tr');
        row.innerHTML = `
          <td>${o.floor}</td>
          <td>${o.name}</td>
          <td>${o.store}</td>
          <td>${o.drink}</td>
          <td>${o.toppings.join(', ')}</td>
          <td>${o.price}</td>
          <td>${o.collect ? '✔' : ''}</td>
        `;
        ordersTbody.appendChild(row);
      });
    totalLabel.textContent = `${t('total')}：${orders.reduce((sum, o) => sum + o.price, 0)}`;
  }

  function exportText() {
    let text = `[${t('order_summary')}]\n`;
    orders.forEach(o => {
      text += `${o.drink}${o.toppings.length ? ' + ' + o.toppings.join(' + ') : ''} $${o.price} - ${o.name}\n`;
    });
    const pays = orders.filter(o => o.collect).map(o => o.name);
    text += `\n${t('paidTogether')}：${[...new Set(pays)].join(', ')}\n`;
    text += `\n📍${t('deliveryAddress')}：汐止區環河街100號（艾訊 - 12:30前送至警衛室寄放）\n`;
    text += `☎️${t('contacts')}：${[...contactSelect.selectedOptions].map(o => o.value).join(', ')}`;
    outputArea.value = text;
  }

  function exportMd() {
    let md = `| ${t('floor')} | ${t('name')} | ${t('store')} | ${t('drink')} | ${t('toppings')} | ${t('price')} | ${t('collect')} |\n`;
    md += '|---|---|---|---|---|---|---|\n';
    orders.forEach(o => {
      md += `| ${o.floor} | ${o.name} | ${o.store} | ${o.drink} | ${o.toppings.join(', ')} | ${o.price} | ${o.collect ? '✔' : ''} |\n`;
    });
    md += `**${t('total')}**：${orders.reduce((sum, o) => sum + o.price, 0)}\n`;
    md += `**${t('paidTogether')}**：${[...new Set(orders.filter(o => o.collect).map(o => o.name))].join(', ')}\n`;
    md += `\n📍**${t('deliveryAddress')}**：汐止區環河街100號（艾訊 - 12:30前送至警衛室寄放）\n`;
    md += `☎️**${t('contacts')}**：${[...contactSelect.selectedOptions].map(o => o.value).join(', ')}`;
    outputArea.value = md;
  }

  passwordSubmit.addEventListener('click', () => { 
    if (passwordInput.value === PASSWORD) {
      loginScreen.style.display = 'none';
      app.style.display = 'block';
      populateFloors();
      populateStores();
      populateContacts();
    } else {
      alert('密碼錯誤');
    }
  });

  langSelect.addEventListener('change', () => {
    currentLang = langSelect.value;
    localStorage.setItem('lang', currentLang);
    document.getElementById('app-title').textContent = t('title');
    document.getElementById('orders-title').textContent = t('order_summary');
  });

  floorSelect.addEventListener('change', filterEmployees);
  addEmployeeBtn.addEventListener('click', async () => {
    const name = prompt('輸入新人員名字');
    const floor = floorSelect.value;
    if (name) {
      employees.push({name, floor});
      localStorage.setItem('employees', JSON.stringify(employees));
      filterEmployees();
    }
  });

  storeSelect.addEventListener('change', filterMenu);
  addOrderBtn.addEventListener('click', () => {
    const [drinkName, drinkPrice] = drinkSelect.value.split('|');
    const selectedTops = [...toppingsSelect.selectedOptions];
    const toppings = selectedTops.map(o => o.value.split('|')[0]);
    const toppingPrice = selectedTops.reduce((sum, o) => sum + parseInt(o.value.split('|')[1]), 0);
    const price = parseInt(drinkPrice) + toppingPrice;
    const floor = floorSelect.value;
    const name = employeeSelect.value;
    const store = storeSelect.value;
    const collect = confirm('是否集中付款?');
    orders.push({floor, name, store, drink: drinkName, toppings, price, collect});
    renderOrders();
  });

  clearOrdersBtn.addEventListener('click', () => { orders = []; renderOrders(); });

  exportTextBtn.addEventListener('click', exportText);
  exportMdBtn.addEventListener('click', exportMd);
});
