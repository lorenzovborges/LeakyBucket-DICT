/**
 * @generated SignedSource<<1922efc4360b5891fc33790af8d5a343>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
export type PixQueryStatus = "FAILED" | "RATE_LIMITED" | "SUCCESS" | "%future added value";
export type QueryPixKeyInput = {
  amount: number;
  pixKey: string;
};
export type PixTransactionTabMutation$variables = {
  input: QueryPixKeyInput;
};
export type PixTransactionTabMutation$data = {
  readonly queryPixKey: {
    readonly availableTokens: number;
    readonly bankName: string | null | undefined;
    readonly consumedToken: boolean;
    readonly maxTokens: number;
    readonly message: string;
    readonly ownerName: string | null | undefined;
    readonly pixKeyFound: boolean;
    readonly requestedAt: any;
    readonly status: PixQueryStatus;
  };
};
export type PixTransactionTabMutation = {
  response: PixTransactionTabMutation$data;
  variables: PixTransactionTabMutation$variables;
};

const node: ConcreteRequest = (function(){
var v0 = [
  {
    "defaultValue": null,
    "kind": "LocalArgument",
    "name": "input"
  }
],
v1 = [
  {
    "alias": null,
    "args": [
      {
        "kind": "Variable",
        "name": "input",
        "variableName": "input"
      }
    ],
    "concreteType": "PixQueryResult",
    "kind": "LinkedField",
    "name": "queryPixKey",
    "plural": false,
    "selections": [
      {
        "alias": null,
        "args": null,
        "kind": "ScalarField",
        "name": "status",
        "storageKey": null
      },
      {
        "alias": null,
        "args": null,
        "kind": "ScalarField",
        "name": "message",
        "storageKey": null
      },
      {
        "alias": null,
        "args": null,
        "kind": "ScalarField",
        "name": "pixKeyFound",
        "storageKey": null
      },
      {
        "alias": null,
        "args": null,
        "kind": "ScalarField",
        "name": "ownerName",
        "storageKey": null
      },
      {
        "alias": null,
        "args": null,
        "kind": "ScalarField",
        "name": "bankName",
        "storageKey": null
      },
      {
        "alias": null,
        "args": null,
        "kind": "ScalarField",
        "name": "availableTokens",
        "storageKey": null
      },
      {
        "alias": null,
        "args": null,
        "kind": "ScalarField",
        "name": "maxTokens",
        "storageKey": null
      },
      {
        "alias": null,
        "args": null,
        "kind": "ScalarField",
        "name": "consumedToken",
        "storageKey": null
      },
      {
        "alias": null,
        "args": null,
        "kind": "ScalarField",
        "name": "requestedAt",
        "storageKey": null
      }
    ],
    "storageKey": null
  }
];
return {
  "fragment": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Fragment",
    "metadata": null,
    "name": "PixTransactionTabMutation",
    "selections": (v1/*: any*/),
    "type": "Mutation",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Operation",
    "name": "PixTransactionTabMutation",
    "selections": (v1/*: any*/)
  },
  "params": {
    "cacheID": "2534191abcd6e430d37ee92168bcf5af",
    "id": null,
    "metadata": {},
    "name": "PixTransactionTabMutation",
    "operationKind": "mutation",
    "text": "mutation PixTransactionTabMutation(\n  $input: QueryPixKeyInput!\n) {\n  queryPixKey(input: $input) {\n    status\n    message\n    pixKeyFound\n    ownerName\n    bankName\n    availableTokens\n    maxTokens\n    consumedToken\n    requestedAt\n  }\n}\n"
  }
};
})();

(node as any).hash = "3a028002e6a53bb7e014ce1cf59d9059";

export default node;
