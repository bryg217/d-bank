import React, { useState, useEffect } from "react";
import Bank from "./contracts/Bank.json";
import getWeb3 from "./getWeb3";

import "./App.css";

export default function App() {
  const [appData, setAppData] = useState(null);
  const [balance, setBalance] = useState('loading balance...');
  const [depositForm, setDepositForm] = useState({name: '', amount: 0});
  const [withdrawForm, setWithdrawForm] = useState({ amount: 0 });

  useEffect(() => {
    (async function() {
      try {
        // Get network provider and web3 instance.
        const web3 = await getWeb3();
  
        const [address] = await web3.eth.getAccounts();

        // Get the contract instance.
        const networkId = await web3.eth.net.getId();
        const deployedNetwork = Bank.networks[networkId];
        const contract = new web3.eth.Contract(
          Bank.abi,
          deployedNetwork.address,
        );

        setAppData({ web3, contract, address });
      } catch (error) {
        // Catch any errors for any of the above operations.
        alert(
          `Failed to load web3, accounts, or contract. Check console for details.`,
        );
        console.error(error);
      }
    })();
  }, []);

  useEffect(() => {
    (async function() {
      if (appData) {
        const { contract, address, web3 } = appData;
        const amountInWei = await contract.methods.getBalance().call({ from: address });
        setBalance(web3.utils.fromWei(amountInWei, 'ether'));
      }
    })();
  }, [appData]);

  function listenToSuccessfulDeposit() {
    const { contract } = appData;
    contract.events.SuccessfulDeposit({}, (error, event) => {
      if (error) console.log(error);
      else console.log(event);
    });
  }

  function listenToSuccessfulWithdraw() {
    const { contract } = appData;
    contract.events.SuccessfulWithdraw({}, (error, event) => {
      if (error) console.log(error);
      else console.log(event);
    });
  }

  function onChange(event) {
    const { name, value } = event.target;
    setDepositForm(previousState => ({...previousState, [name]: value}));
  }

  function onChangeWithdraw(event) {
    const { value } = event.target;
    setWithdrawForm(() => ({amount: value}));
  }

  async function onSubmit(event) {
    event.preventDefault();

    listenToSuccessfulDeposit();
    
    const { name, amount } = depositForm;
    const { contract, address, web3 } = appData;

    const valueInWei = web3.utils.toWei(`${amount}`, 'ether');

    await contract.methods.storePayment(name).send({ from: address, value: valueInWei });
  }
  
  async function onSubmitWithdraw(event) {
    event.preventDefault();

    listenToSuccessfulWithdraw();

    const { address, contract, web3 } = appData;
    const { amount } = withdrawForm;

    const valueInWei = web3.utils.toWei(`${amount}`, 'ether');

    await contract.methods.withdraw(parseInt(valueInWei)).send({ from: address });
  }

  return (
    appData ?
      <div className="app">
        <h1>Bank</h1>
        <h2>Balance</h2>
        <div>{balance}</div>
        <h2>Deposit Form</h2>
        <form onSubmit={onSubmit}>
          <div>
            <label>Name:</label>
            <input name="name" id="name" value={depositForm.name} onChange={onChange}/>
          </div>
          <div>
            <label>Amount:</label>
            <input name="amount" id="amount" value={depositForm.amount} onChange={onChange}/>
          </div>
          <div>
            <button type="submit">Submit</button>
          </div>
        </form>
        <h2>Withdraw Form</h2>
        <form onSubmit={onSubmitWithdraw}>
          <div>
            <label>Amount:</label>
            <input name="amountWithdraw" id="amountWithdraw" value={withdrawForm.amount} onChange={onChangeWithdraw}/>
          </div>
          <div>
            <button type="submit">Submit</button>
          </div>
        </form>
      </div> :
      <div>loading...</div>
  );
}
