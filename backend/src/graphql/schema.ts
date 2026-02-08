import { createSchema } from 'graphql-yoga';
import { GraphQLError, GraphQLScalarType, Kind } from 'graphql';

import { DictValidationError } from '../modules/dict/dict.types';
import type {
  DictBucketListFilter,
  DictBucketStateInput,
  RegisterPaymentSentInput,
  SimulateDictOperationInput
} from '../modules/dict/dict.types';
import type { GraphQLContext } from './context';

const DateTimeScalar = new GraphQLScalarType({
  name: 'DateTime',
  description: 'ISO-8601 date-time scalar',
  serialize(value: unknown): string {
    if (!(value instanceof Date)) {
      throw new TypeError('DateTime can only serialize Date values');
    }

    return value.toISOString();
  },
  parseValue(value: unknown): Date {
    if (typeof value !== 'string') {
      throw new TypeError('DateTime can only parse string values');
    }

    const parsed = new Date(value);

    if (Number.isNaN(parsed.getTime())) {
      throw new TypeError(`Invalid DateTime value: ${value}`);
    }

    return parsed;
  },
  parseLiteral(ast): Date {
    if (ast.kind !== Kind.STRING) {
      throw new TypeError('DateTime can only parse string literals');
    }

    const parsed = new Date(ast.value);

    if (Number.isNaN(parsed.getTime())) {
      throw new TypeError(`Invalid DateTime value: ${ast.value}`);
    }

    return parsed;
  }
});

const typeDefs = /* GraphQL */ `
  scalar DateTime

  type Health {
    status: String!
    timestamp: DateTime!
  }

  enum PixQueryStatus {
    SUCCESS
    FAILED
    RATE_LIMITED
  }

  enum DictOperation {
    GET_ENTRY
    GET_ENTRY_STATISTICS
    CREATE_ENTRY
    DELETE_ENTRY
    UPDATE_ENTRY
    GET_CLAIM
    CREATE_CLAIM
    ACKNOWLEDGE_CLAIM
    CANCEL_CLAIM
    CONFIRM_CLAIM
    COMPLETE_CLAIM
    LIST_CLAIMS
    CREATE_SYNC_VERIFICATION
    CREATE_CID_SET_FILE
    GET_CID_SET_FILE
    LIST_CID_SET_EVENTS
    GET_ENTRY_BY_CID
    GET_INFRACTION_REPORT
    CREATE_INFRACTION_REPORT
    ACKNOWLEDGE_INFRACTION_REPORT
    CANCEL_INFRACTION_REPORT
    CLOSE_INFRACTION_REPORT
    UPDATE_INFRACTION_REPORT
    LIST_INFRACTION_REPORTS
    CHECK_KEYS
    GET_REFUND
    CREATE_REFUND
    CANCEL_REFUND
    CLOSE_REFUND
    LIST_REFUNDS
    GET_FRAUD_MARKER
    CREATE_FRAUD_MARKER
    CANCEL_FRAUD_MARKER
    LIST_FRAUD_MARKERS
    GET_PERSON_STATISTICS
    GET_BUCKET_STATE
    LIST_BUCKET_STATES
    LIST_EVENT_NOTIFICATIONS
  }

  enum DictKeyType {
    EMAIL
    PHONE
    CPF
    CNPJ
    EVP
  }

  enum DictScopeType {
    USER
    PSP
  }

  enum DictPolicyCode {
    ENTRIES_READ_USER_ANTISCAN
    ENTRIES_READ_USER_ANTISCAN_V2
    ENTRIES_READ_PARTICIPANT_ANTISCAN
    ENTRIES_STATISTICS_READ
    ENTRIES_WRITE
    ENTRIES_UPDATE
    CLAIMS_READ
    CLAIMS_WRITE
    CLAIMS_LIST_WITH_ROLE
    CLAIMS_LIST_WITHOUT_ROLE
    SYNC_VERIFICATIONS_WRITE
    CIDS_FILES_WRITE
    CIDS_FILES_READ
    CIDS_EVENTS_LIST
    CIDS_ENTRIES_READ
    INFRACTION_REPORTS_READ
    INFRACTION_REPORTS_WRITE
    INFRACTION_REPORTS_LIST_WITH_ROLE
    INFRACTION_REPORTS_LIST_WITHOUT_ROLE
    KEYS_CHECK
    REFUNDS_READ
    REFUNDS_WRITE
    REFUND_LIST_WITH_ROLE
    REFUND_LIST_WITHOUT_ROLE
    FRAUD_MARKERS_READ
    FRAUD_MARKERS_WRITE
    FRAUD_MARKERS_LIST
    PERSONS_STATISTICS_READ
    POLICIES_READ
    POLICIES_LIST
    EVENT_LIST
  }

  input QueryPixKeyInput {
    pixKey: String!
    amountCents: Int!
  }

  input SimulateDictOperationInput {
    operation: DictOperation!
    simulatedStatusCode: Int!
    payerId: String
    keyType: DictKeyType
    endToEndId: String
    hasRoleFilter: Boolean
  }

  input RegisterPaymentSentInput {
    payerId: String!
    keyType: DictKeyType!
    endToEndId: String!
  }

  input DictBucketStateInput {
    policyCode: DictPolicyCode!
    scopeType: DictScopeType!
    scopeKey: String!
  }

  type PixQueryResult {
    status: PixQueryStatus!
    message: String!
    pixKeyFound: Boolean!
    ownerName: String
    bankName: String
    availableTokens: Int!
    maxTokens: Int!
    consumedToken: Boolean!
    requestedAt: DateTime!
  }

  type BucketState {
    availableTokens: Int!
    maxTokens: Int!
    lastRefillAt: DateTime!
  }

  type DictPolicyImpact {
    policyCode: DictPolicyCode!
    scopeType: DictScopeType!
    scopeKey: String!
    costApplied: Float!
    tokensBefore: Float!
    tokensAfter: Float!
    capacity: Float!
    refillPerSecond: Float!
  }

  type SimulateDictOperationResult {
    allowed: Boolean!
    httpStatus: Int!
    blockedByPolicies: [DictPolicyCode!]!
    impacts: [DictPolicyImpact!]!
  }

  type RegisterPaymentSentResult {
    credited: Boolean!
    reason: String!
    impacts: [DictPolicyImpact!]!
  }

  type DictBucketState {
    policyCode: DictPolicyCode!
    scopeType: DictScopeType!
    scopeKey: String!
    tokens: Float!
    capacity: Float!
    refillPerSecond: Float!
    lastRefillAt: DateTime!
  }

  type Query {
    health: Health!
    myBucket: BucketState!
    dictBucketState(input: DictBucketStateInput!): DictBucketState
    listDictBucketStates(policyCode: DictPolicyCode, scopeType: DictScopeType): [DictBucketState!]!
  }

  type Mutation {
    queryPixKey(input: QueryPixKeyInput!): PixQueryResult!
    simulateDictOperation(input: SimulateDictOperationInput!): SimulateDictOperationResult!
    registerPaymentSent(input: RegisterPaymentSentInput!): RegisterPaymentSentResult!
  }
`;

function requireTenant(context: GraphQLContext): NonNullable<GraphQLContext['tenant']> {
  if (!context.tenant) {
    throw new GraphQLError('Authentication required', {
      extensions: {
        code: 'UNAUTHENTICATED',
        http: {
          status: 401
        }
      }
    });
  }

  return context.tenant;
}

function mapValidationError(error: unknown): never {
  if (error instanceof DictValidationError) {
    throw new GraphQLError(error.message, {
      extensions: {
        code: 'BAD_USER_INPUT'
      }
    });
  }

  throw error;
}

export function createGraphQLSchema() {
  return createSchema<GraphQLContext>({
    typeDefs,
    resolvers: {
      DateTime: DateTimeScalar,
      Query: {
        health: () => ({
          status: 'ok',
          timestamp: new Date()
        }),
        myBucket: async (_parent, _args, context) => {
          const tenant = requireTenant(context);

          return context.leakyBucketService.getBucketState(tenant.id);
        },
        dictBucketState: async (_parent, args: { input: DictBucketStateInput }, context) => {
          const tenant = requireTenant(context);

          try {
            return await context.dictRateLimitService.getBucketState(tenant, args.input);
          } catch (error) {
            mapValidationError(error);
          }
        },
        listDictBucketStates: async (
          _parent,
          args: DictBucketListFilter,
          context
        ) => {
          const tenant = requireTenant(context);

          return context.dictRateLimitService.listBucketStates(tenant, {
            policyCode: args.policyCode,
            scopeType: args.scopeType
          });
        }
      },
      Mutation: {
        queryPixKey: async (
          _parent,
          args: { input: { pixKey: string; amountCents: number } },
          context
        ) => {
          const tenant = requireTenant(context);

          if (!Number.isInteger(args.input.amountCents) || args.input.amountCents <= 0) {
            throw new GraphQLError('amountCents must be a positive integer representing cents', {
              extensions: {
                code: 'BAD_USER_INPUT'
              }
            });
          }

          return context.leakyBucketService.queryPixKey(tenant.id, {
            pixKey: args.input.pixKey,
            amountCents: args.input.amountCents
          });
        },
        simulateDictOperation: async (
          _parent,
          args: { input: SimulateDictOperationInput },
          context
        ) => {
          const tenant = requireTenant(context);

          try {
            return await context.dictRateLimitService.simulateOperation(tenant, args.input);
          } catch (error) {
            mapValidationError(error);
          }
        },
        registerPaymentSent: async (
          _parent,
          args: { input: RegisterPaymentSentInput },
          context
        ) => {
          const tenant = requireTenant(context);

          try {
            return await context.dictRateLimitService.registerPaymentSent(tenant, args.input);
          } catch (error) {
            mapValidationError(error);
          }
        }
      }
    }
  });
}
