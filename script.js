/* ─────────────────────────────────────────
   Calculator State
───────────────────────────────────────── */
const state = {
  current:       '0',   // number being typed
  previous:      null,  // number before operator
  operator:      null,  // pending operator
  justCalculated: false // flag: last action was '='
};

/* ─────────────────────────────────────────
   DOM References
───────────────────────────────────────── */
const displayValue      = document.getElementById('display');
const displayExpression = document.getElementById('expression');

/* ─────────────────────────────────────────
   Display Helpers
───────────────────────────────────────── */
function formatNumber(numStr) {
  if (numStr === 'Error' || numStr === 'Infinity') return numStr;

  const parts  = numStr.split('.');
  const intPart = parts[0].replace('-', '');
  const sign    = parts[0].startsWith('-') ? '-' : '';

  // Limit display length
  if (numStr.replace('-', '').replace('.', '').length > 12) {
    const n = parseFloat(numStr);
    return parseFloat(n.toPrecision(9)).toString();
  }
  return numStr;
}

function updateDisplay() {
  const formatted = formatNumber(state.current);
  displayValue.textContent = formatted;

  // Auto-scale font size for long numbers
  const len = formatted.replace('-', '').length;
  if (len >= 10)       displayValue.style.fontSize = '26px';
  else if (len >= 8)   displayValue.style.fontSize = '34px';
  else if (len >= 6)   displayValue.style.fontSize = '42px';
  else                 displayValue.style.fontSize = '48px';

  // Expression line
  if (state.previous !== null && state.operator) {
    displayExpression.textContent = `${formatNumber(state.previous)} ${state.operator}`;
  } else {
    displayExpression.textContent = '';
  }
}

function flashDisplay() {
  displayValue.classList.remove('pop');
  // Trigger reflow so the animation restarts
  void displayValue.offsetWidth;
  displayValue.classList.add('pop');
}

/* ─────────────────────────────────────────
   Core Logic
───────────────────────────────────────── */
function calculate(a, b, op) {
  const numA = parseFloat(a);
  const numB = parseFloat(b);
  switch (op) {
    case '+': return numA + numB;
    case '−': return numA - numB;
    case '×': return numA * numB;
    case '÷':
      if (numB === 0) return 'Error';
      return numA / numB;
    default:  return numB;
  }
}

function cleanResult(val) {
  if (val === 'Error' || val === 'Infinity' || isNaN(val)) return 'Error';
  // Trim floating point noise
  const s = parseFloat(val.toPrecision(12)).toString();
  return s;
}

/* ─────────────────────────────────────────
   Actions
───────────────────────────────────────── */
function handleNumber(digit) {
  if (state.current === 'Error') { handleClear(); }

  if (state.justCalculated) {
    state.current       = digit;
    state.justCalculated = false;
  } else {
    if (state.current === '0') {
      state.current = digit;
    } else {
      if (state.current.replace('-', '').replace('.', '').length >= 12) return;
      state.current += digit;
    }
  }
  updateDisplay();
}

function handleDecimal() {
  if (state.current === 'Error') { handleClear(); }
  if (state.justCalculated) {
    state.current        = '0.';
    state.justCalculated  = false;
    updateDisplay();
    return;
  }
  if (!state.current.includes('.')) {
    state.current += '.';
    updateDisplay();
  }
}

function handleOperator(op) {
  if (state.current === 'Error') return;

  // Chain calculations: if there's a pending operation, resolve it first
  if (state.previous !== null && state.operator && !state.justCalculated) {
    const result = calculate(state.previous, state.current, state.operator);
    state.current = cleanResult(result);
    flashDisplay();
  }

  state.previous       = state.current;
  state.operator       = op;
  state.justCalculated  = true; // next number digit will start fresh

  // Highlight active operator button
  document.querySelectorAll('.btn-operator').forEach(b => b.classList.remove('active-op'));
  document.querySelectorAll('.btn-operator').forEach(b => {
    if (b.dataset.value === op) b.classList.add('active-op');
  });

  updateDisplay();
}

function handleEquals() {
  if (state.current === 'Error' || state.operator === null || state.previous === null) return;

  const expression = `${formatNumber(state.previous)} ${state.operator} ${formatNumber(state.current)}`;
  const result     = calculate(state.previous, state.current, state.operator);
  const cleaned    = cleanResult(result);

  displayExpression.textContent = expression + ' =';
  state.current        = cleaned;
  state.previous       = null;
  state.operator       = null;
  state.justCalculated  = true;

  flashDisplay();
  displayValue.textContent = formatNumber(cleaned);
  if (cleaned === 'Error') displayValue.classList.add('error');
  else                      displayValue.classList.remove('error');

  // Remove active-op highlights
  document.querySelectorAll('.btn-operator').forEach(b => b.classList.remove('active-op'));
}

function handleClear() {
  state.current        = '0';
  state.previous       = null;
  state.operator       = null;
  state.justCalculated  = false;
  displayValue.classList.remove('error');
  document.querySelectorAll('.btn-operator').forEach(b => b.classList.remove('active-op'));
  updateDisplay();
}

function handleSign() {
  if (state.current === '0' || state.current === 'Error') return;
  state.current = state.current.startsWith('-')
    ? state.current.slice(1)
    : '-' + state.current;
  updateDisplay();
}

function handlePercent() {
  if (state.current === 'Error') return;
  const val = parseFloat(state.current) / 100;
  state.current = parseFloat(val.toPrecision(12)).toString();
  updateDisplay();
}

/* ─────────────────────────────────────────
   Button Click Events
───────────────────────────────────────── */
document.querySelectorAll('.btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const action = btn.dataset.action;
    const value  = btn.dataset.value;

    switch (action) {
      case 'number':   handleNumber(value);   break;
      case 'decimal':  handleDecimal();        break;
      case 'operator': handleOperator(value); break;
      case 'equals':   handleEquals();         break;
      case 'clear':    handleClear();          break;
      case 'sign':     handleSign();           break;
      case 'percent':  handlePercent();        break;
    }
  });
});

/* ─────────────────────────────────────────
   Keyboard Support (Bonus)
───────────────────────────────────────── */
const keyMap = {
  '0':'0','1':'1','2':'2','3':'3','4':'4',
  '5':'5','6':'6','7':'7','8':'8','9':'9',
  '.': 'decimal',
  '+': '+', '-': '−', '*': '×', '/': '÷',
  'Enter': 'equals', '=': 'equals',
  'Backspace': 'backspace',
  'Escape': 'clear', 'c': 'clear', 'C': 'clear',
  '%': 'percent'
};

document.addEventListener('keydown', e => {
  const mapped = keyMap[e.key];
  if (!mapped) return;
  e.preventDefault();

  // Flash the corresponding button
  let selector = null;
  if ('0123456789'.includes(mapped)) {
    selector = `[data-action="number"][data-value="${mapped}"]`;
  } else if (['+','−','×','÷'].includes(mapped)) {
    selector = `[data-action="operator"][data-value="${mapped}"]`;
  } else if (mapped === 'equals')   selector = '[data-action="equals"]';
  else if (mapped === 'clear')      selector = '[data-action="clear"]';
  else if (mapped === 'decimal')    selector = '[data-action="decimal"]';
  else if (mapped === 'percent')    selector = '[data-action="percent"]';

  if (selector) {
    const btn = document.querySelector(selector);
    if (btn) {
      btn.classList.add('key-flash');
      btn.addEventListener('animationend', () => btn.classList.remove('key-flash'), { once: true });
    }
  }

  // Backspace: delete last character
  if (mapped === 'backspace') {
    if (state.justCalculated || state.current === 'Error') { handleClear(); return; }
    state.current = state.current.length > 1
      ? state.current.slice(0, -1)
      : '0';
    updateDisplay();
    return;
  }

  if (mapped === 'clear')   { handleClear();           return; }
  if (mapped === 'equals')  { handleEquals();           return; }
  if (mapped === 'decimal') { handleDecimal();          return; }
  if (mapped === 'percent') { handlePercent();          return; }
  if (['+','−','×','÷'].includes(mapped)) { handleOperator(mapped); return; }
  if ('0123456789'.includes(mapped))      { handleNumber(mapped);   return; }
});

/* ─────────────────────────────────────────
   Init
───────────────────────────────────────── */
updateDisplay();