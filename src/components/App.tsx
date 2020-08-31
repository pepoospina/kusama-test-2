import * as React from "react";
import { ApiPromise, WsProvider } from "@polkadot/api";
import { hexToString } from "@polkadot/util";

const reactLogo = require("./../assets/img/react_logo.svg");
import "./../assets/scss/App.scss";

const validIdentityEntries = (identityCoded: any) => {
  const identity = identityCoded.toJSON();
  if (!identity || !identity.info) return {};

  const identityData = Object.getOwnPropertyNames(identity.info)
    .map((prop: any) =>
      identity.info[prop] !== null && identity.info[prop].Raw !== undefined
        ? { [prop]: hexToString(identity.info[prop].Raw) }
        : undefined,
    )
    .filter((e) => !!e);

  let identityInfo = {};
  identityData.forEach((e) => {
    const name = Object.getOwnPropertyNames(e)[0];
    const value = e[name];
    identityInfo[name] = value;
  });

  return identityInfo;
};

class App extends React.Component<Record<string, unknown>, any> {
  blockInput: HTMLInputElement;

  constructor(props) {
    super(props);
    this.state = {
      result: {},
      loading: false,
      blockNumber: 3351476,
      address: "DqpNAWBTgPQFETepyPvigwrY6eTxtKS6obajvai8h7G18pn",
    };
  }

  async componentWillMount() {
    this.load();
  }

  async load() {
    const blockNumber = this.state.blockNumber;
    const address = this.state.address;
    this.setState({ loading: true });
    const wsProvider = new WsProvider("wss://kusama-rpc.polkadot.io");
    const api = await ApiPromise.create({ provider: wsProvider });
    const blockHash = await api.rpc.chain.getBlockHash(blockNumber);
    const timestamp: any = await api.query.timestamp.now.at(blockHash);
    const date = new Date(timestamp.toNumber());

    const identity = await api.query.identity.identityOf.at(blockHash, address);

    const identityInfo = validIdentityEntries(identity);

    this.setState({
      result: {
        timestamp: date.toUTCString(),
        chain: await api.rpc.system.chain(),
        address: await api.query.system.account.at(blockHash, address),
        identity: identityInfo,
        members: await api.query.council.members.at(blockHash),
      },
      loading: false,
    });
  }

  blockChanged(e: any) {
    this.setState({ blockNumber: e.target.value });
  }

  addressChanged(e: any) {
    this.setState({ address: e.target.value });
  }

  public render() {
    return (
      <div className="app">
        <h1>Kusama</h1>
        <input
          value={this.state.blockNumber}
          onChange={(evt) => this.blockChanged(evt)}
        ></input>
        <input
          value={this.state.address}
          onChange={(evt) => this.addressChanged(evt)}
        ></input>
        <button onClick={() => this.load()}>update</button>
        {this.state.loading ? (
          <p>Loading...</p>
        ) : (
          <pre>{JSON.stringify(this.state.result, undefined, 2)}</pre>
        )}
      </div>
    );
  }
}

export default App;
