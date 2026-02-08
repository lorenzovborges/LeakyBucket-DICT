/**
 * @generated SignedSource<<428015ad194cc98ba9586ae84e20609e>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
export type DictKeyType = "CNPJ" | "CPF" | "EMAIL" | "EVP" | "PHONE" | "%future added value";
export type DictOperation = "ACKNOWLEDGE_CLAIM" | "ACKNOWLEDGE_INFRACTION_REPORT" | "CANCEL_CLAIM" | "CANCEL_FRAUD_MARKER" | "CANCEL_INFRACTION_REPORT" | "CANCEL_REFUND" | "CHECK_KEYS" | "CLOSE_INFRACTION_REPORT" | "CLOSE_REFUND" | "COMPLETE_CLAIM" | "CONFIRM_CLAIM" | "CREATE_CID_SET_FILE" | "CREATE_CLAIM" | "CREATE_ENTRY" | "CREATE_FRAUD_MARKER" | "CREATE_INFRACTION_REPORT" | "CREATE_REFUND" | "CREATE_SYNC_VERIFICATION" | "DELETE_ENTRY" | "GET_BUCKET_STATE" | "GET_CID_SET_FILE" | "GET_CLAIM" | "GET_ENTRY" | "GET_ENTRY_BY_CID" | "GET_ENTRY_STATISTICS" | "GET_FRAUD_MARKER" | "GET_INFRACTION_REPORT" | "GET_PERSON_STATISTICS" | "GET_REFUND" | "LIST_BUCKET_STATES" | "LIST_CID_SET_EVENTS" | "LIST_CLAIMS" | "LIST_EVENT_NOTIFICATIONS" | "LIST_FRAUD_MARKERS" | "LIST_INFRACTION_REPORTS" | "LIST_REFUNDS" | "UPDATE_ENTRY" | "UPDATE_INFRACTION_REPORT" | "%future added value";
export type DictPolicyCode = "CIDS_ENTRIES_READ" | "CIDS_EVENTS_LIST" | "CIDS_FILES_READ" | "CIDS_FILES_WRITE" | "CLAIMS_LIST_WITHOUT_ROLE" | "CLAIMS_LIST_WITH_ROLE" | "CLAIMS_READ" | "CLAIMS_WRITE" | "ENTRIES_READ_PARTICIPANT_ANTISCAN" | "ENTRIES_READ_USER_ANTISCAN" | "ENTRIES_READ_USER_ANTISCAN_V2" | "ENTRIES_STATISTICS_READ" | "ENTRIES_UPDATE" | "ENTRIES_WRITE" | "EVENT_LIST" | "FRAUD_MARKERS_LIST" | "FRAUD_MARKERS_READ" | "FRAUD_MARKERS_WRITE" | "INFRACTION_REPORTS_LIST_WITHOUT_ROLE" | "INFRACTION_REPORTS_LIST_WITH_ROLE" | "INFRACTION_REPORTS_READ" | "INFRACTION_REPORTS_WRITE" | "KEYS_CHECK" | "PERSONS_STATISTICS_READ" | "POLICIES_LIST" | "POLICIES_READ" | "REFUNDS_READ" | "REFUNDS_WRITE" | "REFUND_LIST_WITHOUT_ROLE" | "REFUND_LIST_WITH_ROLE" | "SYNC_VERIFICATIONS_WRITE" | "%future added value";
export type DictScopeType = "PSP" | "USER" | "%future added value";
export type SimulateDictOperationInput = {
  endToEndId?: string | null | undefined;
  hasRoleFilter?: boolean | null | undefined;
  keyType?: DictKeyType | null | undefined;
  operation: DictOperation;
  payerId?: string | null | undefined;
  simulatedStatusCode: number;
};
export type DictSimulatorTabMutation$variables = {
  input: SimulateDictOperationInput;
};
export type DictSimulatorTabMutation$data = {
  readonly simulateDictOperation: {
    readonly allowed: boolean;
    readonly blockedByPolicies: ReadonlyArray<DictPolicyCode>;
    readonly httpStatus: number;
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
  };
};
export type DictSimulatorTabMutation = {
  response: DictSimulatorTabMutation$data;
  variables: DictSimulatorTabMutation$variables;
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
    "concreteType": "SimulateDictOperationResult",
    "kind": "LinkedField",
    "name": "simulateDictOperation",
    "plural": false,
    "selections": [
      {
        "alias": null,
        "args": null,
        "kind": "ScalarField",
        "name": "allowed",
        "storageKey": null
      },
      {
        "alias": null,
        "args": null,
        "kind": "ScalarField",
        "name": "httpStatus",
        "storageKey": null
      },
      {
        "alias": null,
        "args": null,
        "kind": "ScalarField",
        "name": "blockedByPolicies",
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
    "name": "DictSimulatorTabMutation",
    "selections": (v1/*: any*/),
    "type": "Mutation",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Operation",
    "name": "DictSimulatorTabMutation",
    "selections": (v1/*: any*/)
  },
  "params": {
    "cacheID": "55d9595c5357c0344d078d26428ee080",
    "id": null,
    "metadata": {},
    "name": "DictSimulatorTabMutation",
    "operationKind": "mutation",
    "text": "mutation DictSimulatorTabMutation(\n  $input: SimulateDictOperationInput!\n) {\n  simulateDictOperation(input: $input) {\n    allowed\n    httpStatus\n    blockedByPolicies\n    impacts {\n      policyCode\n      scopeType\n      scopeKey\n      costApplied\n      tokensBefore\n      tokensAfter\n      capacity\n      refillPerSecond\n    }\n  }\n}\n"
  }
};
})();

(node as any).hash = "33d475d54a3f1513d0c315dd09c63319";

export default node;
