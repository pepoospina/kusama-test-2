import * as React from "react";
import { hot } from "react-hot-loader";
import { ApiPromise, WsProvider } from '@polkadot/api';

const reactLogo = require("./../assets/img/react_logo.svg");
import "./../assets/scss/App.scss";

class App extends React.Component<Record<string, unknown>, any> {

  constructor(props) {
    super(props);
    this.state = {
      result: {},
      loading: false
    }
  }

  async componentWillMount() {
    this.setState({ loading: true });
    const wsProvider = new WsProvider('wss://rpc.polkadot.io');
    const api = await ApiPromise.create({ provider: wsProvider });
    this.setState({ result: { genesisHash: api.genesisHash.toHex() }, loading: false });
  }

  public render() {
    return (
      <div className="app">
        <h1>Kusama</h1>
        { this.state.loading ? (<p>Loading...</p>) : (<pre>{JSON.stringify(this.state.result, undefined, 2)}</pre>) }
      </div>
    );
  }
}

declare let module: Record<string, unknown>;

export default hot(module)(App);
