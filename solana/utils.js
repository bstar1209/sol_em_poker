import Base58 from 'bs58'
import * as anchor from "@project-serum/anchor";
import { Connection, PublicKey, clusterApiUrl } from '@solana/web3.js';
import splToken from '@solana/spl-token'
import { deserializeUnchecked } from 'borsh';
import fetch from "node-fetch";

import { CANDY_MACHINE_ID, ANCHOR_URL, CLUSTERS } from '../config/index.js'

const METADATA_PREFIX = "metadata";

let MetadataKey = {
  'Uninitialized': 0,
  'MetadataV1': 4,
  'EditionV1': 1,
  'MasterEditionV1': 2,
  'MasterEditionV2': 6,
  'EditionMarker': 7,
}

var Creator = /** @class */ (function () {
  function Creator(args) {
    this.address = args.address;
    this.verified = args.verified;
    this.share = args.share;
  }
  return Creator;
}());

var Data = /** @class */ (function () {
  function Data(args) {
    this.name = args.name;
    this.symbol = args.symbol;
    this.uri = args.uri;
    this.sellerFeeBasisPoints = args.sellerFeeBasisPoints;
    this.creators = args.creators;
  }
  return Data;
}());

var Metadata = /** @class */ (function () {
  function Metadata(args) {
    this.key = MetadataKey.MetadataV1;
    this.updateAuthority = args.updateAuthority;
    this.mint = args.mint;
    this.data = args.data;
    this.primarySaleHappened = args.primarySaleHappened;
    this.isMutable = args.isMutable;
  }
  return Metadata;
}());


const TOKEN_PROGRAM_ID = new PublicKey(
  "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
);

const SPL_ASSOCIATED_TOKEN_ACCOUNT_PROGRAM_ID = new PublicKey(
  "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"
);

const BPF_UPGRADE_LOADER_ID = new PublicKey(
  "BPFLoaderUpgradeab1e11111111111111111111111"
);

const MEMO_ID = new PublicKey("MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr");

const METADATA_PROGRAM_ID = "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s";

const VAULT_ID = "vau1zxA2LbssAUEF7Gpw91zMM1LvXrvpzJtmZ58rPsn";

const AUCTION_ID = "auctxRXPeJoc4817jDhf4HbjnhEcr1cCXenosMhK5R8";

const METAPLEX_ID = "p1exdMJcjVao65QdewkaZRUnU6VPSXhus9n2GzWfh98";

const SYSTEM = new PublicKey("11111111111111111111111111111111");

var METADATA_SCHEMA = new Map([
  [
    Data,
    {
      kind: "struct",
      fields: [
        ["name", "string"],
        ["symbol", "string"],
        ["uri", "string"],
        ["sellerFeeBasisPoints", "u16"],
        ["creators", { kind: "option", type: [Creator] }],
      ],
    },
  ],
  [
    Creator,
    {
      kind: "struct",
      fields: [
        ["address", [32]],
        ["verified", "u8"],
        ["share", "u8"],
      ],
    },
  ],
  [
    Metadata,
    {
      kind: "struct",
      fields: [
        ["key", "u8"],
        ["updateAuthority", [32]],
        ["mint", [32]],
        ["data", Data],
        ["primarySaleHappened", "u8"],
        ["isMutable", "u8"],
      ],
    },
  ],
]);

const string2Uint8Array = async (str) => {
  var decodedString;
  try {
    decodedString = Base58.decode(str);
  } catch (error) {
    return [];
  }
  let arr = [];

  for (var i = 0; i < decodedString.length; i++) {
    arr.push(decodedString[i]);
  };

  return arr;
}

const Uint8Array2String = async (arr) => {
  try {
    const buffer = Buffer.from(arr);
    return Base58.encode(buffer);
  } catch (error) {
    return '';
  }

}

const findProgramAddress = async (seeds, programId) => {
  const key = "pda-" + seeds.reduce((agg, item) => agg + item.toString("hex"), "") + programId.toString();

  const result = await PublicKey.findProgramAddress(seeds, programId);

  return [result[0].toBase58(), result[1]];
};

const programIds = () => {
  return {
    token: TOKEN_PROGRAM_ID,
    associatedToken: SPL_ASSOCIATED_TOKEN_ACCOUNT_PROGRAM_ID,
    bpf_upgrade_loader: BPF_UPGRADE_LOADER_ID,
    system: SYSTEM,
    metadata: METADATA_PROGRAM_ID,
    memo: MEMO_ID,
    vault: VAULT_ID,
    auction: AUCTION_ID,
    metaplex: METAPLEX_ID,
  };
};

const decodeMetadata = (buffer) => {
  const metadata = deserializeUnchecked(
    METADATA_SCHEMA,
    Metadata,
    buffer
  );

  metadata.data.name = metadata.data.name.replace(/\0/g, "");
  metadata.data.symbol = metadata.data.symbol.replace(/\0/g, "");
  metadata.data.uri = metadata.data.uri.replace(/\0/g, "");
  metadata.data.name = metadata.data.name.replace(/\0/g, "");
  return metadata;
};

const toPublicKey = (key) => {
  let PubKeysInternedMap = new Map();
  if (typeof key !== "string") {
    return key;
  }

  let result = PubKeysInternedMap.get(key);
  if (!result) {
    result = new PublicKey(key);
    PubKeysInternedMap.set(key, result);
  }

  return result;
};

const getMetadataKey = async (tokenMint) => {
  const PROGRAM_IDS = programIds();

  return (
    await findProgramAddress(
      [
        Buffer.from(METADATA_PREFIX),
        toPublicKey(PROGRAM_IDS.metadata).toBuffer(),
        toPublicKey(tokenMint).toBuffer(),
      ],
      toPublicKey(PROGRAM_IDS.metadata)
    )
  )[0];
}

const fetchMetadataFromPDA = async (pubkey, url) => {
  const connection = new anchor.web3.Connection(url);
  const metadataKey = await getMetadataKey(pubkey.toBase58());
  const metadataInfo = await connection.getAccountInfo(
    toPublicKey(metadataKey)
  );

  return metadataInfo;
}

const getMetadata = async (pubkey, url) => {
  let metadata;

  try {
    const metadataPromise = await fetchMetadataFromPDA(pubkey, url);

    if (metadataPromise && metadataPromise.data.length > 0) {
      metadata = decodeMetadata(metadataPromise.data);
    }
  } catch (e) {
    console.log(e);
  }

  return metadata;
}

const createJsonObject = async (key) => {
  const tokenMetadata = await getMetadata(new anchor.web3.PublicKey(key), ANCHOR_URL);
  const mints = [];

  const arweaveData = await fetch(tokenMetadata.data.uri).then((res) =>
    res.json().catch()
  ).catch(() => {
    mints.push({ tokenMetadata, failed: true })
  });

  mints.push({
    tokenData: {
      ...tokenMetadata.data,
      creators: tokenMetadata.data.creators.map((d) => {
        return {
          share: d.share,
          address: new PublicKey(d.address).toBase58(),
          verified: !!d.verified,
        };
      }),
    },
    metadata: arweaveData,
    mint: key,
  });

  return mints[0];
};

const getMeta = async (token) => {
  return await createJsonObject(token)
}

const getMints = async () => {
  const connection = new anchor.web3.Connection(ANCHOR_URL);
  const account = await connection.getProgramAccounts(
    new PublicKey(METADATA_PROGRAM_ID),
    {
      encoding: 'base64',
      filters: [
        {
          "memcmp": {
            "offset": 326,
            "bytes": CANDY_MACHINE_ID
          }
        }
      ]
    }
  )

  const deserialized = account.map(elem => deserializeUnchecked(METADATA_SCHEMA, Metadata, elem.account.data));
  return deserialized;
}

const getTokenHolder = async (token) => {
  try {
    const res = await fetch(ANCHOR_URL, {
      body: `{
          "jsonrpc":"2.0", 
          "id":1, 
          "method":"getProgramAccounts", 
          "params":[
            "${TOKEN_PROGRAM_ID}",
            {
              "encoding": "jsonParsed",
              "filters": [
                {
                  "dataSize": 165
                },
                {
                  "memcmp": {
                    "offset": 0,
                    "bytes": "${token}"
                  }
                }
              ]
            }
          ]}
      `,
      headers: {
        "Content-Type": "application/json",
      },
      method: "POST",
    });

    const json = await res.json();

    const filtered = json.result.find((elem) => elem.account.data.parsed.info.tokenAmount.uiAmount == 1)

    let owner = filtered.account.data.parsed.info.owner;
    return owner;
  } catch (error) {
    console.log('error is detected when get the owner')
    return '';
  }
}

const getTokensByOwner = async (address) => {
  const connection = new Connection(clusterApiUrl(CLUSTERS.MAINNET), 'confirmed');
  let response = await connection.getParsedTokenAccountsByOwner(
    new PublicKey(address),
    {
      programId: splToken.TOKEN_PROGRAM_ID,
    },
  );

  return response.value;
}

export default {
  string2Uint8Array,
  Uint8Array2String,
  getMints,
  getMeta,
  getTokenHolder,
  getMetadataKey,
  getTokensByOwner,
}