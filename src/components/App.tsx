import * as React from "react";
import { hot } from "react-hot-loader";
import { ApiPromise, WsProvider } from '@polkadot/api';

const reactLogo = require("./../assets/img/react_logo.svg");
import "./../assets/scss/App.scss";

class App extends React.Component<Record<string, unknown>, any> {

  blockInput: HTMLInputElement;

  constructor(props) {
    super(props);
    this.state = {
      result: {},
      loading: false,
      blockNumber: 3351476
    }
  }

  async componentWillMount() {
    this.load();
  }

  async load() {
    const blockNumber = this.state.blockNumber;
    this.setState({ loading: true });
    const wsProvider = new WsProvider('wss://kusama-rpc.polkadot.io');
    const api = await ApiPromise.create({ provider: wsProvider });
    const blockHash = await api.rpc.chain.getBlockHash(blockNumber)
    const timestamp = await api.query.timestamp.now.at(blockHash);
    const date = new Date((timestamp as any)*1000);
    this.setState({ result: { 
      genesisHash: api.genesisHash.toHex(),
      now: date.toDateString(),
      chain: await api.rpc.system.chain(),
      address: await api.query.system.account.at(blockHash, 'DqpNAWBTgPQFETepyPvigwrY6eTxtKS6obajvai8h7G18pn'),
      members: await api.query.council.members.at(blockHash)
    }, loading: false });
  }

  blockChanged(e: any) {
    this.setState({ blockNumber: e.target.value })
  }

  public render() {
    return (
      <div className="app">
        <h1>Kusama</h1>
        <input value={this.state.blockNumber} onChange={evt => this.blockChanged(evt)}></input>
        <button onClick={() => this.load()}>update</button>
        { this.state.loading ? (<p>Loading...</p>) : (<pre>{JSON.stringify(this.state.result, undefined, 2)}</pre>) }
      </div>
    );
  }
}

declare let module: Record<string, unknown>;

export default hot(module)(App);
