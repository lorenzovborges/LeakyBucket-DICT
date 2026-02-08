/**
 * @generated SignedSource<<b77de2ea268acdfbc5d44e170f6d3494>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
export type DictKeyType = "CNPJ" | "CPF" | "EMAIL" | "EVP" | "PHONE" | "%future added value";
export type DictPolicyCode = "CIDS_ENTRIES_READ" | "CIDS_EVENTS_LIST" | "CIDS_FILES_READ" | "CIDS_FILES_WRITE" | "CLAIMS_LIST_WITHOUT_ROLE" | "CLAIMS_LIST_WITH_ROLE" | "CLAIMS_READ" | "CLAIMS_WRITE" | "ENTRIES_READ_PARTICIPANT_ANTISCAN" | "ENTRIES_READ_USER_ANTISCAN" | "ENTRIES_READ_USER_ANTISCAN_V2" | "ENTRIES_STATISTICS_READ" | "ENTRIES_UPDATE" | "ENTRIES_WRITE" | "EVENT_LIST" | "FRAUD_MARKERS_LIST" | "FRAUD_MARKERS_READ" | "FRAUD_MARKERS_WRITE" | "INFRACTION_REPORTS_LIST_WITHOUT_ROLE" | "INFRACTION_REPORTS_LIST_WITH_ROLE" | "INFRACTION_REPORTS_READ" | "INFRACTION_REPORTS_WRITE" | "KEYS_CHECK" | "PERSONS_STATISTICS_READ" | "POLICIES_LIST" | "POLICIES_READ" | "REFUNDS_READ" | "REFUNDS_WRITE" | "REFUND_LIST_WITHOUT_ROLE" | "REFUND_LIST_WITH_ROLE" | "SYNC_VERIFICATIONS_WRITE" | "%future added value";
export type DictScopeType = "PSP" | "USER" | "%future added value";
export type RegisterPaymentSentInput = {
  endToEndId: string;
  keyType: DictKeyType;
  payerId: string;
};
export type RegisterPaymentButtonMutation$variables = {
  input: RegisterPaymentSentInput;
};
export type RegisterPaymentButtonMutation$data = {
  readonly registerPaymentSent: {
    readonly credited: boolean;
    readonly impacts: ReadonlyArray<{
      readonly capacity: number;
      readonly costApplied: number;
      readonly policyCode: DictPolicyCode;
      readonly refillPerSecond: number;
      readonly scopeKey: string;
      readonly scopeType: DictScopeType;
      readonly tokensAfter: number;
      readonly tokensBefore: number;
    }>;
    readonly reason: string;
  };
};
export type RegisterPaymentButtonMutation = {
  response: RegisterPaymentButtonMutation$data;
  variables: RegisterPaymentButtonMutation$variables;
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
    "concreteType": "RegisterPaymentSentResult",
    "kind": "LinkedField",
    "name": "registerPaymentSent",
    "plural": false,
    "selections": [
      {
        "alias": null,
        "args": null,
        "kind": "ScalarField",
        "name": "credited",
        "storageKey": null
      },
      {
        "alias": null,
        "args": null,
        "kind": "ScalarField",
        "name": "reason",
        "storageKey": null
      },
      {
        "alias": null,
        "args": null,
        "concreteType": "DictPolicyImpact",
        "kind": "LinkedField",
        "name": "impacts",
        "plural": true,
        "selections": [
          {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "policyCode",
            "storageKey": null
          },
          {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "scopeType",
            "storageKey": null
          },
          {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "scopeKey",
            "storageKey": null
          },
          {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "costApplied",
            "storageKey": null
          },
          {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "tokensBefore",
            "storageKey": null
          },
          {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "tokensAfter",
            "storageKey": null
          },
          {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "capacity",
            "storageKey": null
          },
          {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "refillPerSecond",
            "storageKey": null
          }
        ],
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
    "name": "RegisterPaymentButtonMutation",
    "selections": (v1/*: any*/),
    "type": "Mutation",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Operation",
    "name": "RegisterPaymentButtonMutation",
    "selections": (v1/*: any*/)
  },
  "params": {
    "cacheID": "b3b77e4073b16f981ec08ade9e9fc769",
    "id": null,
    "metadata": {},
    "name": "RegisterPaymentButtonMutation",
    "operationKind": "mutation",
    "text": "mutation RegisterPaymentButtonMutation(\n  $input: RegisterPaymentSentInput!\n) {\n  registerPaymentSent(input: $input) {\n    credited\n    reason\n    impacts {\n      policyCode\n      scopeType\n      scopeKey\n      costApplied\n      tokensBefore\n      tokensAfter\n      capacity\n      refillPerSecond\n    }\n  }\n}\n"
  }
};
})();

(node as any).hash = "c3a978e6acbf866a5f666bdd750347e8";

export default node;
