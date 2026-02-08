/**
 * @generated SignedSource<<dbe6bd18d454b75664c3411b5b63d077>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
export type PixTransactionTabBucketQuery$variables = Record<PropertyKey, never>;
export type PixTransactionTabBucketQuery$data = {
  readonly myBucket: {
    readonly availableTokens: number;
    readonly lastRefillAt: any;
    readonly maxTokens: number;
  };
};
export type PixTransactionTabBucketQuery = {
  response: PixTransactionTabBucketQuery$data;
  variables: PixTransactionTabBucketQuery$variables;
};

const node: ConcreteRequest = (function(){
var v0 = [
  {
    "alias": null,
    "args": null,
    "concreteType": "BucketState",
    "kind": "LinkedField",
    "name": "myBucket",
    "plural": false,
    "selections": [
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
        "name": "lastRefillAt",
        "storageKey": null
      }
    ],
    "storageKey": null
  }
];
return {
  "fragment": {
    "argumentDefinitions": [],
    "kind": "Fragment",
    "metadata": null,
    "name": "PixTransactionTabBucketQuery",
    "selections": (v0/*: any*/),
    "type": "Query",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": [],
    "kind": "Operation",
    "name": "PixTransactionTabBucketQuery",
    "selections": (v0/*: any*/)
  },
  "params": {
    "cacheID": "1a577a32d82bcb6d80f934b3ef31818e",
    "id": null,
    "metadata": {},
    "name": "PixTransactionTabBucketQuery",
    "operationKind": "query",
    "text": "query PixTransactionTabBucketQuery {\n  myBucket {\n    availableTokens\n    maxTokens\n    lastRefillAt\n  }\n}\n"
  }
};
})();

(node as any).hash = "1a3b0abf2d46efa3f3074d7839a2d88e";

export default node;
