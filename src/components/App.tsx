import * as React from "react";
import { ApiPromise, WsProvider } from "@polkadot/api";
import {
  web3Accounts,
  web3Enable,
  web3FromAddress,
} from "@polkadot/extension-dapp";

const reactLogo = require("./../assets/img/react_logo.svg");
import "./../assets/scss/App.scss";

const getIdentityInfo = (identity) => {
  if (identity && identity.isSome) {
    const { info } = identity.toHuman();
    return info;
  }
  return {};
};

// Picks out the the cid parts from the users additional fields and assembles the final string
const getCID = (info): string => {
  if (!info.additional) {
    return "";
  }
  const [[, { Raw: cid0 }], [, { Raw: cid1 }]] = info.additional
    .filter(([k]) => k.Raw === "cid0" || k.Raw === "cid1")
    .sort(([a], [b]) => (a.Raw < b.Raw ? -1 : 1));
  console.log(cid0, cid1);

  const cid = cid0 + cid1;
  return cid;
};

class App extends React.Component<Record<string, unknown>, any> {
  blockInput: HTMLInputElement;

  constructor(props) {
    super(props);
    this.state = {
      api: {},
      result: {},
      identityInfo: {},
      loading: false,
      blockNumber: 0,
      address: "5FR5YJy3uwcEkXkRaaqsgARJ4C74V1zA8C6DRAECderYFGRk",
      account: {},
    };
  }

  async componentWillMount(): Promise<void> {
    this.load();
  }

  async load(): Promise<void> {
    const blockNumber = this.state.blockNumber;
    this.setState({ loading: true });
    const wsProvider = new WsProvider("ws://127.0.0.1:9944");
    const api = await ApiPromise.create({ provider: wsProvider });
    this.setState({ api });

    // Returns an array of all the injected sources
    // (this needs to be called first, before other requests)
    const allInjected = await web3Enable("uprtcl-wiki");

    // returns an array of { address, meta: { name, source } }
    // meta.source contains the name of the extension that provides this account
    const allAccounts = await web3Accounts();
    const account = allAccounts[0];

    // Set extension account as signer
    const injector = await web3FromAddress(account.address);
    api.setSigner(injector.signer);

    const blockHash = await api.rpc.chain.getBlockHash(blockNumber);
    const timestamp: any = await api.query.timestamp.now.at(blockHash);
    const date = new Date(timestamp.toNumber());

    // Retrieve the chain name
    // E.g. "Westend", "Kusama"
    const chain = await api.rpc.system.chain();
    console.log(chain.toString());

    // Retrieve identity info
    const identity = await api.query.identity.identityOf(account.address);
    const identityInfo = getIdentityInfo(identity);
    const cid = getCID(identityInfo);

    this.setState({
      api,
      account,
      cid,
      result: {
        timestamp: date.toUTCString(),
        chain: await api.rpc.system.chain(),
        address: await api.query.system.account.at(blockHash, account.address),
        identity: identityInfo,
        // doesn't work on local chain
        // members: await api.tx.council.members.at(blockHash),
      },
      loading: false,
    });
  }

  blockChanged(e: React.ChangeEvent<HTMLInputElement>): void {
    this.setState({ blockNumber: e.target.value });
  }

  addressChanged(e: React.ChangeEvent<HTMLInputElement>): void {
    this.setState({ address: e.target.value });
  }

  cidChanged(e: React.ChangeEvent<HTMLInputElement>): void {
    this.setState({ cid: e.target.value });
  }

  async storeCid(): Promise<void> {
    const cid0 = this.state.cid.substring(0, 32);
    const cid1 = this.state.cid.substring(32, 64);
    const result = await this.state.api.tx.identity.setIdentity({
      ...this.state.identityInfo,
      additional: [
        [{ Raw: "cid0" }, { Raw: cid0 }],
        [{ Raw: "cid1" }, { Raw: cid1 }],
      ],
    });
    const txHash = await result.signAndSend(this.state.account.address);
    console.log(txHash);
  }

  public render(): React.ReactElement {
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
        <div>
          <input
            onChange={(evt) => this.cidChanged(evt)}
            maxLength={64}
            value={this.state.cid}
            style={{ width: "64ch" }}
          />
          <button onClick={() => this.storeCid()}>Store CID</button>
        </div>
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
