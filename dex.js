
// Connect to Moralis server
const serverUrl = "serverURL";
const appId = "AppID";
const masterKey = "master key";

Moralis.start({serverUrl, appId, masterKey})


Moralis
    .initPlugins()
    .then(() => console.log("Plugins have been initialized"));

//Moralis Code
const $tokenBalanceTbody = document.querySelector('.js-token-balances');
const $selectedToken = document.querySelector(".js-from-token");
const $amountInput = document.querySelector('.js-from-amount');

/* Utilities */
// Conveting from Wei using custom function
const tokenValue = (value, decimals) => (decimals ? value / Math.pow(10, decimals) : value);

// add from here down
async function login() {
    let user = Moralis.User.current();
    if (!user) {
      user = await Moralis.authenticate();
    }
    console.log("logged in user:", user);
    getStats();
  }

  async function logOut() {
    await Moralis.User.logOut();
    console.log("logged out");
  }

document.querySelector("#btn-login").addEventListener('click', login);
document.getElementById("btn-logout").addEventListener('click', logOut);

/* Quote / Swap */

async function formSubmitted(event) {
  event.preventDefault();
  const fromAmount = Number.parseFloat($amountInput.value);
  const fromMaxValue = Number.parseFloat($selectedToken.dataset.max);
  if (Number.isNaN(fromAmount) || fromAmount > fromMaxValue) {
    // invalid input
    document.querySelector('.js-amount-error').innerText = 'Invalid amount';
  } else {
    document.querySelector('.js-amount-error').innerText = '';
  }

}

async function formCanceled(event) {
  event.preventDefault();
  document.querySelector('.js-submit').setAttribute('disabled', '');
  document.querySelector('.js-cancel').setAttribute('disabled', '');
  $amountInput.value = '';
  $amountInput.setAttribute('disabled', ''); //enables input field
  delete $selectedToken.dataset.address;
  delete $selectedToken.dataset.decimals;
  delete $selectedToken.dataset.max;
  document.querySelector('.js-quote-container').innerHTML = '';
  document.querySelector('.js-amount-error').innerText = '';

  $selectedToken.innerText = event.target.dataset.symbol;

}

document.querySelector('.js-submit').addEventListener('click', formSubmitted);
document.querySelector('.js-cancel').addEventListener('click', formCanceled)

async function initSwapForm(event) {
  event.preventDefault()
  $selectedToken.innerText = event.target.dataset.symbol;
  $selectedToken.dataset.address = event.target.dataset.address;
  $selectedToken.dataset.decimals = event.target.dataset.decimals;
  $selectedToken.dataset.max = event.target.dataset.max;
  $amountInput.removeAttribute('disabled'); //enables input field
  $amountInput.value = '';
  document.querySelector('.js-submit').removeAttribute('disabled');
  document.querySelector('.js-cancel').removeAttribute('disabled');
  document.querySelector('.js-quote-container').innerHTML = '';
  document.querySelector('.js-amount-error').innerText = '';
}

async function getStats(event) {
  const balances = await Moralis.Web3API.account.getTokenBalances();
  console.log(balances);
  $tokenBalanceTbody.innerHTML = balances.map((token, index) => `
  <tr>
      <td>${index + 1}</td>
      <td>${token.symbol}</td>
      <td>${tokenValue(token.balance, token.decimals)}</td>
      <td>
        <button
            class="js-swap"
            data-address="${token.token_address}"
            data-symbol="${token.symbol}"
            data-decimals="${token.decimals}"
            data-max="${tokenValue(token.balance, token.decimals)}"
        >
          Swap
        </button>
      </td>
  </tr>
`).join('')
  for (let $btn of $tokenBalanceTbody.querySelectorAll(".js-swap"))
    $btn.addEventListener('click', initSwapForm)
}

const user = Moralis.User.current();
  if (user) {
    getUserTransactions(user);
  }



 async function getUserTransactions(user) {
     // create query
    const query = new Moralis.Query("EthTransactions");
    query.equalTo("from_address", user.get("ethAddress"));
  
    //run query
    const results = await query.find();
    console.log("user transactions:", results);
  }
  
  // get stats on page load
  getStats();

  /** To token dropdown preparation **/
async function getTop10Tokens () {
    const response = await fetch("https://api.coinpaprika.com/v1/coins");
    const tokens = await response.json();

    return tokens
            .filter(token => token.rank >= 1 && token.rank <=10)
            .map(token => token.symbol)
}

async function getTickerData(tickerList) {
    let response = await fetch("https://api.1inch.exchange/v4.0/1/tokens");
    let tokens = await response.json()
    let tokenList = Object.values(tokens.tokens)

    return tokenList.filter(token => tickerList.includes(token.symbol))
}

//https://api.1inch.exchange/v4.0/1/tokens

function renderForm(tokens) {
    const options = tokens.map(token => 
        `<option value="${token.decimals}-${token.address}">${token.name} (${token.symbol})</option>`);
    console.log(tokens);
    console.log(options.join(''));
    document.querySelector('[name=from-token]').innerHTML = options;
    document.querySelector('[name=to-token]').innerHTML = options; 
}

//document.querySelector('.js-submit-quote').addEventListener('click', formSubmitted);

function renderTokenDropdown(tokens) {
  const options = tokens.map(token => `
    <option value="${token.address}-${token.decimals}">
      ${token.name}
    </option>
  `).join('')
  document.querySelector('[name=to-token').innerHTML = options;
}


getTop10Tokens()
    .then(getTickerData)
    .then(renderTokenDropdown) //renderTokenDropdown

