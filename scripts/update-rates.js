
const fs = require("fs");

const KUCOIN_URL =
  "https://api.kucoin.com/api/v1/market/orderbook/level1?symbol=WEMIX-USDT";

const USD_PHP_URL =
  "https://open.er-api.com/v6/latest/USD";

const PNIX_URL =
  "https://mir4-router.pnix.exchange/dex";

const PAIRS = {
  EXDRA1: "0x28deeae37f7b52579153d9be0bab2e347ceac414",
  EXDRA2: "0xbc01e61505121a7135544f138d4e010276483b8e",
  EXDRA3: "0x535f65e66c353a417da9bbc3e249210622dd7fb7",
  EXDRA4: "0xceacf0882412d27dc8be0679ee51e1faed1dbc21"
};


/*
=====================================================
GET WEMIX USDT
=====================================================
*/

async function getWemixUSDT() {

  const response = await fetch(KUCOIN_URL);

  if (!response.ok) {
    throw new Error("KuCoin request failed");
  }

  const data = await response.json();

  const price = Number(data.data.price);

  if (!price || price <= 0) {
    throw new Error("Invalid WEMIX price");
  }

  return price;
}


/*
=====================================================
GET USD PHP
=====================================================
*/

async function getUSDPHP() {

  const response = await fetch(USD_PHP_URL);

  if (!response.ok) {
    throw new Error("USD/PHP request failed");
  }

  const data = await response.json();

  const rate = Number(data.rates.PHP);

  if (!rate || rate <= 0) {
    throw new Error("Invalid USD/PHP rate");
  }

  return rate;
}


/*
=====================================================
GET PNIX BILLBOARD
=====================================================
*/

async function getBillboard() {

  const payload = {
    id: 1,
    jsonrpc: "2.0",
    method: "dex_getBillboard",
    params: []
  };

  const response = await fetch(PNIX_URL, {
    method: "POST",

    headers: {
      "Content-Type": "application/json"
    },

    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error("PNIX request failed");
  }

  const data = await response.json();

  if (!data.result) {
    throw new Error("PNIX billboard returned no result");
  }

  return data.result;
}


/*
=====================================================
MAIN
=====================================================
*/

async function main() {

  console.log("Getting live crypto rates...");

  const wemixUSDT = await getWemixUSDT();

  console.log("WEMIX USDT:", wemixUSDT);


  const usdPHP = await getUSDPHP();

  console.log("USD PHP:", usdPHP);


  const billboard = await getBillboard();


  /*
  WEMIX

  WEMIX USDT × USD PHP
  */

  const wemixPHP =
    wemixUSDT * usdPHP;


  const rates = {

    WEMIX: Number(wemixPHP.toFixed(2))

  };


  /*
  EXDRA

  TOKEN → WEMIX → USDT → PHP
  */

  for (const token of Object.keys(PAIRS)) {

    const pair =
      PAIRS[token].toLowerCase();


    const item =
      billboard.find(function(row) {

        return (
          String(row.pair).toLowerCase() === pair
        );

      });


    if (!item) {

      console.log(
        token + ": Pair not found"
      );

      continue;

    }


    const tokenWemix =
      Number(item.close);


    const tokenPHP =
      tokenWemix *
      wemixUSDT *
      usdPHP;


    rates[token] =
      Number(tokenPHP.toFixed(2));


    console.log(
      token + ":",
      rates[token]
    );

  }


  /*
  SAVE DATA
  */

  const output = {

    success: true,

    updatedAt:
      new Date().toISOString(),

    usdtPHP:
      Number(usdPHP.toFixed(2)),

    wemixUSDT:
      Number(wemixUSDT.toFixed(8)),

    rates: rates

  };


  fs.writeFileSync(
    "rates.json",
    JSON.stringify(output, null, 2)
  );


  console.log(
    "rates.json updated successfully."
  );

}


main().catch(function(error) {

  console.error(error);

  process.exit(1);

});
