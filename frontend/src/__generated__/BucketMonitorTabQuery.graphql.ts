/**
 * @generated SignedSource<<6fc49999eb8918b00a19f4d54fb11dbc>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
export type DictPolicyCode = "CIDS_ENTRIES_READ" | "CIDS_EVENTS_LIST" | "CIDS_FILES_READ" | "CIDS_FILES_WRITE" | "CLAIMS_LIST_WITHOUT_ROLE" | "CLAIMS_LIST_WITH_ROLE" | "CLAIMS_READ" | "CLAIMS_WRITE" | "ENTRIES_READ_PARTICIPANT_ANTISCAN" | "ENTRIES_READ_USER_ANTISCAN" | "ENTRIES_READ_USER_ANTISCAN_V2" | "ENTRIES_STATISTICS_READ" | "ENTRIES_UPDATE" | "ENTRIES_WRITE" | "EVENT_LIST" | "FRAUD_MARKERS_LIST" | "FRAUD_MARKERS_READ" | "FRAUD_MARKERS_WRITE" | "INFRACTION_REPORTS_LIST_WITHOUT_ROLE" | "INFRACTION_REPORTS_LIST_WITH_ROLE" | "INFRACTION_REPORTS_READ" | "INFRACTION_REPORTS_WRITE" | "KEYS_CHECK" | "PERSONS_STATISTICS_READ" | "POLICIES_LIST" | "POLICIES_READ" | "REFUNDS_READ" | "REFUNDS_WRITE" | "REFUND_LIST_WITHOUT_ROLE" | "REFUND_LIST_WITH_ROLE" | "SYNC_VERIFICATIONS_WRITE" | "%future added value";
export type DictScopeType = "PSP" | "USER" | "%future added value";
export type BucketMonitorTabQuery$variables = {
  policyCode?: DictPolicyCode | null | undefined;
  scopeType?: DictScopeType | null | undefined;
};
export type BucketMonitorTabQuery$data = {
  readonly listDictBucketStates: ReadonlyArray<{
    readonly capacity: number;
    readonly lastRefillAt: any;
    readonly policyCode: DictPolicyCode;
    readonly refillPerSecond: number;
    readonly scopeKey: string;
    readonly scopeType: DictScopeType;
    readonly tokens: number;
  }>;
};
export type BucketMonitorTabQuery = {
  response: BucketMonitorTabQuery$data;
  variables: BucketMonitorTabQuery$variables;
};

const node: ConcreteRequest = (function(){
var v0 = [
  {
    "defaultValue": null,
    "kind": "LocalArgument",
    "name": "policyCode"
  },
  {
    "defaultValue": null,
    "kind": "LocalArgument",
    "name": "scopeType"
  }
],
v1 = [
  {
    "alias": null,
    "args": [
      {
        "kind": "Variable",
        "name": "policyCode",
        "variableName": "policyCode"
      },
      {
        "kind": "Variable",
        "name": "scopeType",
        "variableName": "scopeType"
      }
    ],
    "concreteType": "DictBucketState",
    "kind": "LinkedField",
    "name": "listDictBucketStates",
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
        "name": "tokens",
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
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Fragment",
    "metadata": null,
    "name": "BucketMonitorTabQuery",
    "selections": (v1/*: any*/),
    "type": "Query",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Operation",
    "name": "BucketMonitorTabQuery",
    "selections": (v1/*: any*/)
  },
  "params": {
    "cacheID": "f4013619f303289d8b84533e482ae450",
    "id": null,
    "metadata": {},
    "name": "BucketMonitorTabQuery",
    "operationKind": "query",
    "text": "query BucketMonitorTabQuery(\n  $policyCode: DictPolicyCode\n  $scopeType: DictScopeType\n) {\n  listDictBucketStates(policyCode: $policyCode, scopeType: $scopeType) {\n    policyCode\n    scopeType\n    scopeKey\n    tokens\n    capacity\n    refillPerSecond\n    lastRefillAt\n  }\n}\n"
  }
};
})();

(node as any).hash = "60d604c5bbef95f5d9e7b76768b34b7f";

export default node;
