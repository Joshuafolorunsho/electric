/* eslint-disable */
import Long from "long";
import _m0 from "protobufjs/minimal.js";
import { messageTypeRegistry } from "../typeRegistry.js";

export const protobufPackage = "Electric.Satellite";

/**
 * This file defines protobuf protocol for Satellite <> Electric replication
 *
 * In this document there is a notation of the Client/Server and
 * Producer/Consumer which are used to annotate messages.
 *
 * This protocol uses a custom RPC implementation that allows bidirectional RPC calls (usually the client
 * calls the server, but the server makes some RPC calls to the client too) and non-RPC messages.
 *
 * Any RPC call should be done as an `SatRpcRequest` message, with `message` field being a method-appropriate
 * encoded message from this protocol. The answering side should then respond with `SatRpcResponse` with the same
 * method and request id. If RPC call fully failed, the `error` field will be filled. Otherwise, the message field
 * will be field, which may or may not have its own internal error fields.
 *
 * Any message not wrapped in rpc request or response should not warrant a direct response from the other side.
 */

export enum SatAuthHeader {
  /** UNSPECIFIED - Required by the Protobuf spec. */
  UNSPECIFIED = 0,
  UNRECOGNIZED = -1,
}

/** RPC request transport message, must be used to implement service RPC calls in the protocol */
export interface SatRpcRequest {
  $type: "Electric.Satellite.SatRpcRequest";
  method: string;
  requestId: number;
  message: Uint8Array;
}

/** RPC response transport message, must be used to implement service RPC calls in the protocol */
export interface SatRpcResponse {
  $type: "Electric.Satellite.SatRpcResponse";
  method: string;
  requestId: number;
  message?: Uint8Array | undefined;
  error?: SatErrorResp | undefined;
}

export interface SatAuthHeaderPair {
  $type: "Electric.Satellite.SatAuthHeaderPair";
  key: SatAuthHeader;
  value: string;
}

/**
 * (Client) Auth request
 *
 * Client request is the first request that the client should send before
 * executing any other request.
 */
export interface SatAuthReq {
  $type: "Electric.Satellite.SatAuthReq";
  /**
   * Identity of the Satellite application. Is expected to be something like
   * UUID. Required field
   */
  id: string;
  /** Authentication token, auth method specific, required */
  token: string;
  /** Headers, required */
  headers: SatAuthHeaderPair[];
}

/** (Server) Auth response */
export interface SatAuthResp {
  $type: "Electric.Satellite.SatAuthResp";
  /** Identity of the Server */
  id: string;
  /** Headers optional */
  headers: SatAuthHeaderPair[];
}

/**
 * General purpose error message, that could be sent to any request from any
 * side. FIXME: We might want to separate that into Client/Server parts.
 */
export interface SatErrorResp {
  $type: "Electric.Satellite.SatErrorResp";
  errorType: SatErrorResp_ErrorCode;
  /** lsn of the txn that caused the problem, if available */
  lsn?:
    | Uint8Array
    | undefined;
  /** human readable explanation of what went wrong */
  message?: string | undefined;
}

export enum SatErrorResp_ErrorCode {
  INTERNAL = 0,
  AUTH_REQUIRED = 1,
  AUTH_FAILED = 2,
  REPLICATION_FAILED = 3,
  INVALID_REQUEST = 4,
  PROTO_VSN_MISMATCH = 5,
  SCHEMA_VSN_MISMATCH = 6,
  UNRECOGNIZED = -1,
}

/** (Consumer) Starts replication stream from producer to consumer */
export interface SatInStartReplicationReq {
  $type: "Electric.Satellite.SatInStartReplicationReq";
  /** LSN position of the log on the producer side */
  lsn: Uint8Array;
  options: SatInStartReplicationReq_Option[];
  /** the subscriptions identifiers the client wants to resume subscription */
  subscriptionIds: string[];
  /** The version of the most recent migration seen by the client. */
  schemaVersion?: string | undefined;
}

export enum SatInStartReplicationReq_Option {
  /** NONE - Required by the Protobuf spec. */
  NONE = 0,
  UNRECOGNIZED = -1,
}

/** (Producer) The result of the start replication requests */
export interface SatInStartReplicationResp {
  $type: "Electric.Satellite.SatInStartReplicationResp";
  /** returned in case replication fails to start */
  err?: SatInStartReplicationResp_ReplicationError | undefined;
}

/** Error returned by the Producer when replication fails to start */
export interface SatInStartReplicationResp_ReplicationError {
  $type: "Electric.Satellite.SatInStartReplicationResp.ReplicationError";
  /** error code */
  code: SatInStartReplicationResp_ReplicationError_Code;
  /** a human-readable description of the error */
  message: string;
}

/** error code enum */
export enum SatInStartReplicationResp_ReplicationError_Code {
  /** CODE_UNSPECIFIED - Required by the Protobuf spec. */
  CODE_UNSPECIFIED = 0,
  /** BEHIND_WINDOW - requested LSN is behind the current replication window */
  BEHIND_WINDOW = 1,
  /** INVALID_POSITION - e.g. jumping ahead of the subscriptions cursor */
  INVALID_POSITION = 2,
  /** SUBSCRIPTION_NOT_FOUND - requested subscription not found */
  SUBSCRIPTION_NOT_FOUND = 3,
  /** MALFORMED_LSN - the replication request has malformed LSN */
  MALFORMED_LSN = 4,
  /**
   * UNKNOWN_SCHEMA_VSN - consumer requested replication at schema version that is
   * not known to the producer
   */
  UNKNOWN_SCHEMA_VSN = 5,
  UNRECOGNIZED = -1,
}

/** (Consumer) Request to stop replication */
export interface SatInStopReplicationReq {
  $type: "Electric.Satellite.SatInStopReplicationReq";
}

/** (Producer) Acknowledgement that replication has been stopped */
export interface SatInStopReplicationResp {
  $type: "Electric.Satellite.SatInStopReplicationResp";
}

export interface SatRelationColumn {
  $type: "Electric.Satellite.SatRelationColumn";
  name: string;
  type: string;
  primaryKey: boolean;
  isNullable: boolean;
}

export interface SatRelation {
  $type: "Electric.Satellite.SatRelation";
  schemaName: string;
  tableType: SatRelation_RelationType;
  tableName: string;
  /**
   * Volatile identity defined at the start of the replication protocol may or
   * may not be persisted is used in SatTransOp operations, to indicate
   * relation the operation is working on.
   */
  relationId: number;
  columns: SatRelationColumn[];
}

export enum SatRelation_RelationType {
  TABLE = 0,
  INDEX = 1,
  VIEW = 2,
  TRIGGER = 3,
  UNRECOGNIZED = -1,
}

/**
 * (Producer) Type defines replication messages, that flow from Producer once
 * the replication is established. Message contains operations log. Operations
 * should go in the LSN order. Begin and Commit operations corresponds to
 * transaction boundaries.
 * Transactions are guranteed not to be mixed, and will follow one by one.
 */
export interface SatOpLog {
  $type: "Electric.Satellite.SatOpLog";
  ops: SatTransOp[];
}

/**
 * (Producer) Single operation, should be only send as part of the SatOplog
 * message
 */
export interface SatTransOp {
  $type: "Electric.Satellite.SatTransOp";
  begin?: SatOpBegin | undefined;
  commit?: SatOpCommit | undefined;
  update?: SatOpUpdate | undefined;
  insert?: SatOpInsert | undefined;
  delete?: SatOpDelete | undefined;
  migrate?: SatOpMigrate | undefined;
  compensation?: SatOpCompensation | undefined;
}

/**
 * (Producer) Replication message that indicates transaction boundaries
 * should be only send as payload in the SatTransOp message
 */
export interface SatOpBegin {
  $type: "Electric.Satellite.SatOpBegin";
  commitTimestamp: Long;
  transId: string;
  /**
   * Lsn position that points to first data segment of transaction in the
   * WAL
   */
  lsn: Uint8Array;
  /**
   * Globally unique id of the source that transaction originated from. For
   * data coming from Satellite this field is ignored. For data coming from
   * Electric this field can be used to deduce if the incoming transaction
   * originated on this Satellite instance or not.
   */
  origin?:
    | string
    | undefined;
  /** does this transaction contain ddl statements? */
  isMigration: boolean;
}

/**
 * (Producer) Replication message that indicates transaction boundaries
 * should be only send as payload in the SatTransOp message
 */
export interface SatOpCommit {
  $type: "Electric.Satellite.SatOpCommit";
  commitTimestamp: Long;
  transId: string;
  lsn: Uint8Array;
}

/**
 * (Producer) Data manipulation message, that only should be part of the
 * SatTransOp message
 */
export interface SatOpInsert {
  $type: "Electric.Satellite.SatOpInsert";
  relationId: number;
  rowData:
    | SatOpRow
    | undefined;
  /** dependency information */
  tags: string[];
}

/**
 * (Producer) Data manipulation message, that only should be part of the
 * SatTransOp message
 */
export interface SatOpUpdate {
  $type: "Electric.Satellite.SatOpUpdate";
  relationId: number;
  rowData: SatOpRow | undefined;
  oldRowData:
    | SatOpRow
    | undefined;
  /** dependency information */
  tags: string[];
}

/**
 * (Producer) Data manipulation message, that only should be part of the
 * SatTransOp message
 */
export interface SatOpDelete {
  $type: "Electric.Satellite.SatOpDelete";
  relationId: number;
  oldRowData:
    | SatOpRow
    | undefined;
  /** dependency information */
  tags: string[];
}

export interface SatOpCompensation {
  $type: "Electric.Satellite.SatOpCompensation";
  relationId: number;
  pkData:
    | SatOpRow
    | undefined;
  /** dependency information */
  tags: string[];
}

/** Message that corresponds to the single row. */
export interface SatOpRow {
  $type: "Electric.Satellite.SatOpRow";
  nullsBitmask: Uint8Array;
  /**
   * values may contain binaries with size 0 for NULLs and empty values
   * check nulls_bitmask to differentiate between the two
   */
  values: Uint8Array[];
}

/**
 * A migration message, originating in Postgres, captured via event triggers,
 * propagated to electric, converted from postgres to the equivalent sqlite
 * statement and inserted into the replication stream
 *
 * Each migration message includes the sql strings to execute on the satellite
 * client as well as metadata information about the resulting structure of the
 * changed tables.
 */
export interface SatOpMigrate {
  $type: "Electric.Satellite.SatOpMigrate";
  /**
   * the migration version as specified by the developer and put into
   * the postgresql migration as an electric function call
   */
  version: string;
  /**
   * a list of sql ddl statements to apply, converted from the pg originals
   * The migration machinery converts an `ALTER TABLE action1, action2, action3;`
   * query into a set of 3: `ALTER TABLE action1; ALTER TABLE action2,` etc
   * so we need to support 1+ statements for every migration event.
   */
  stmts: SatOpMigrate_Stmt[];
  /**
   * The resulting table definition after applying these migrations
   * (a DDL statement can only affect one table at a time).
   */
  table?: SatOpMigrate_Table | undefined;
}

export enum SatOpMigrate_Type {
  CREATE_TABLE = 0,
  CREATE_INDEX = 1,
  ALTER_ADD_COLUMN = 6,
  UNRECOGNIZED = -1,
}

export interface SatOpMigrate_Stmt {
  $type: "Electric.Satellite.SatOpMigrate.Stmt";
  type: SatOpMigrate_Type;
  sql: string;
}

export interface SatOpMigrate_PgColumnType {
  $type: "Electric.Satellite.SatOpMigrate.PgColumnType";
  /** the pg type name, e.g. int4, char */
  name: string;
  /**
   * array dimensions, or [] for scalar types
   * e.g. for a column declared as int4[][3], size = [-1, 3]
   */
  array: number[];
  /** any size information, e.g. for varchar(SIZE) or [] for no size */
  size: number[];
}

export interface SatOpMigrate_Column {
  $type: "Electric.Satellite.SatOpMigrate.Column";
  name: string;
  sqliteType: string;
  pgType: SatOpMigrate_PgColumnType | undefined;
}

export interface SatOpMigrate_ForeignKey {
  $type: "Electric.Satellite.SatOpMigrate.ForeignKey";
  /** the columns in the child table that point to the parent */
  fkCols: string[];
  /** the parent table */
  pkTable: string;
  /** the cols in the parent table */
  pkCols: string[];
}

export interface SatOpMigrate_Table {
  $type: "Electric.Satellite.SatOpMigrate.Table";
  name: string;
  columns: SatOpMigrate_Column[];
  fks: SatOpMigrate_ForeignKey[];
  pks: string[];
}

/** (Consumer) Request for new subscriptions */
export interface SatSubsReq {
  $type: "Electric.Satellite.SatSubsReq";
  /** a client-generated identifier to track the subscription */
  subscriptionId: string;
  /** Shape requests */
  shapeRequests: SatShapeReq[];
}

/** (Producer) Response for a subscription request */
export interface SatSubsResp {
  $type: "Electric.Satellite.SatSubsResp";
  /** identifier of the subscription this response refers to */
  subscriptionId: string;
  /** the error details if the request failed */
  err?: SatSubsResp_SatSubsError | undefined;
}

/**
 * Error message returned by the Producer when it encounters
 * an error handling subscription request
 */
export interface SatSubsResp_SatSubsError {
  $type: "Electric.Satellite.SatSubsResp.SatSubsError";
  /** error code */
  code: SatSubsResp_SatSubsError_Code;
  /** A human-readable description of the error */
  message: string;
  /** Details of the shape request error */
  shapeRequestError: SatSubsResp_SatSubsError_ShapeReqError[];
}

/** error code enum */
export enum SatSubsResp_SatSubsError_Code {
  /** CODE_UNSPECIFIED - Required by the Protobuf spec. */
  CODE_UNSPECIFIED = 0,
  /** SUBSCRIPTION_ID_ALREADY_EXISTS - DUPLICATE IDENTIFIER */
  SUBSCRIPTION_ID_ALREADY_EXISTS = 1,
  /** SHAPE_REQUEST_ERROR - Error requesting shape */
  SHAPE_REQUEST_ERROR = 2,
  UNRECOGNIZED = -1,
}

/** Shape request error */
export interface SatSubsResp_SatSubsError_ShapeReqError {
  $type: "Electric.Satellite.SatSubsResp.SatSubsError.ShapeReqError";
  /** error code */
  code: SatSubsResp_SatSubsError_ShapeReqError_Code;
  /** a human-readable description of the error */
  message: string;
  /** the shape request identifier that this error refers to */
  requestId: string;
}

/** error code enum */
export enum SatSubsResp_SatSubsError_ShapeReqError_Code {
  /** CODE_UNSPECIFIED - Required by the Protobuf spec. */
  CODE_UNSPECIFIED = 0,
  /** TABLE_NOT_FOUND - Table does not exist in current schema version */
  TABLE_NOT_FOUND = 1,
  /** REFERENTIAL_INTEGRITY_VIOLATION - Requested shape does not maintain referential integirty */
  REFERENTIAL_INTEGRITY_VIOLATION = 2,
  /** EMPTY_SHAPE_DEFINITION - The shape request contains an empty shape definition */
  EMPTY_SHAPE_DEFINITION = 3,
  /** DUPLICATE_TABLE_IN_SHAPE_DEFINITION - Attempt to request the same table more than once in one shape */
  DUPLICATE_TABLE_IN_SHAPE_DEFINITION = 4,
  UNRECOGNIZED = -1,
}

/** (Consumer) Request to cancel subscriptions */
export interface SatUnsubsReq {
  $type: "Electric.Satellite.SatUnsubsReq";
  /** Identifiers of the subscriptions */
  subscriptionIds: string[];
}

/** (Producer) Acknowledgment that the subscriptions were cancelled */
export interface SatUnsubsResp {
  $type: "Electric.Satellite.SatUnsubsResp";
}

/** Shape request */
export interface SatShapeReq {
  $type: "Electric.Satellite.SatShapeReq";
  /** Identifier of the request */
  requestId: string;
  /** The shape definition */
  shapeDefinition: SatShapeDef | undefined;
}

/** Top-level structure of a shape definition */
export interface SatShapeDef {
  $type: "Electric.Satellite.SatShapeDef";
  /** Selects for the Shape definition */
  selects: SatShapeDef_Select[];
}

/** Select structure */
export interface SatShapeDef_Select {
  $type: "Electric.Satellite.SatShapeDef.Select";
  /** table name for this select */
  tablename: string;
}

/**
 * Error message returned by the Producer when it encounters
 * an error handling subscription data
 */
export interface SatSubsDataError {
  $type: "Electric.Satellite.SatSubsDataError";
  /** error code */
  code: SatSubsDataError_Code;
  /** A human-readable description of the error */
  message: string;
  /** Subscription identifier this error refers to */
  subscriptionId: string;
  /** Details of the shape request error */
  shapeRequestError: SatSubsDataError_ShapeReqError[];
}

/** error code enum */
export enum SatSubsDataError_Code {
  /** CODE_UNSPECIFIED - Required by the Protobuf spec. */
  CODE_UNSPECIFIED = 0,
  /** SHAPE_DELIVERY_ERROR - Error delivering shape */
  SHAPE_DELIVERY_ERROR = 1,
  UNRECOGNIZED = -1,
}

/** Shape request error */
export interface SatSubsDataError_ShapeReqError {
  $type: "Electric.Satellite.SatSubsDataError.ShapeReqError";
  /** error code */
  code: SatSubsDataError_ShapeReqError_Code;
  /** a human-readable description of the error */
  message: string;
  /** the shape request identifier that this error refers to */
  requestId: string;
}

/** error code enum */
export enum SatSubsDataError_ShapeReqError_Code {
  /** CODE_UNSPECIFIED - Required by the Protobuf spec. */
  CODE_UNSPECIFIED = 0,
  /** SHAPE_SIZE_LIMIT_EXCEEDED - Requested shape exceed the maximum allowed shape size */
  SHAPE_SIZE_LIMIT_EXCEEDED = 1,
  UNRECOGNIZED = -1,
}

/** Begin delimiter for the incoming subscription data */
export interface SatSubsDataBegin {
  $type: "Electric.Satellite.SatSubsDataBegin";
  /** Identifier of the subscription */
  subscriptionId: string;
  /** LSN at which this data is being sent. May be a duplicate of a transaction that was sent immediately before. */
  lsn: Uint8Array;
}

/** End delimiter for the incoming subscription data */
export interface SatSubsDataEnd {
  $type: "Electric.Satellite.SatSubsDataEnd";
}

/** Begin delimiter for the initial shape data */
export interface SatShapeDataBegin {
  $type: "Electric.Satellite.SatShapeDataBegin";
  /** Identifier of the request */
  requestId: string;
  /** The UUID of the shape on the Producer */
  uuid: string;
}

/** End delimiter for the initial shape data */
export interface SatShapeDataEnd {
  $type: "Electric.Satellite.SatShapeDataEnd";
}

function createBaseSatRpcRequest(): SatRpcRequest {
  return { $type: "Electric.Satellite.SatRpcRequest", method: "", requestId: 0, message: new Uint8Array() };
}

export const SatRpcRequest = {
  $type: "Electric.Satellite.SatRpcRequest" as const,

  encode(message: SatRpcRequest, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.method !== "") {
      writer.uint32(10).string(message.method);
    }
    if (message.requestId !== 0) {
      writer.uint32(16).uint32(message.requestId);
    }
    if (message.message.length !== 0) {
      writer.uint32(26).bytes(message.message);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): SatRpcRequest {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseSatRpcRequest();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.method = reader.string();
          continue;
        case 2:
          if (tag !== 16) {
            break;
          }

          message.requestId = reader.uint32();
          continue;
        case 3:
          if (tag !== 26) {
            break;
          }

          message.message = reader.bytes();
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  create<I extends Exact<DeepPartial<SatRpcRequest>, I>>(base?: I): SatRpcRequest {
    return SatRpcRequest.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<SatRpcRequest>, I>>(object: I): SatRpcRequest {
    const message = createBaseSatRpcRequest();
    message.method = object.method ?? "";
    message.requestId = object.requestId ?? 0;
    message.message = object.message ?? new Uint8Array();
    return message;
  },
};

messageTypeRegistry.set(SatRpcRequest.$type, SatRpcRequest);

function createBaseSatRpcResponse(): SatRpcResponse {
  return { $type: "Electric.Satellite.SatRpcResponse", method: "", requestId: 0, message: undefined, error: undefined };
}

export const SatRpcResponse = {
  $type: "Electric.Satellite.SatRpcResponse" as const,

  encode(message: SatRpcResponse, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.method !== "") {
      writer.uint32(10).string(message.method);
    }
    if (message.requestId !== 0) {
      writer.uint32(16).uint32(message.requestId);
    }
    if (message.message !== undefined) {
      writer.uint32(26).bytes(message.message);
    }
    if (message.error !== undefined) {
      SatErrorResp.encode(message.error, writer.uint32(34).fork()).ldelim();
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): SatRpcResponse {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseSatRpcResponse();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.method = reader.string();
          continue;
        case 2:
          if (tag !== 16) {
            break;
          }

          message.requestId = reader.uint32();
          continue;
        case 3:
          if (tag !== 26) {
            break;
          }

          message.message = reader.bytes();
          continue;
        case 4:
          if (tag !== 34) {
            break;
          }

          message.error = SatErrorResp.decode(reader, reader.uint32());
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  create<I extends Exact<DeepPartial<SatRpcResponse>, I>>(base?: I): SatRpcResponse {
    return SatRpcResponse.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<SatRpcResponse>, I>>(object: I): SatRpcResponse {
    const message = createBaseSatRpcResponse();
    message.method = object.method ?? "";
    message.requestId = object.requestId ?? 0;
    message.message = object.message ?? undefined;
    message.error = (object.error !== undefined && object.error !== null)
      ? SatErrorResp.fromPartial(object.error)
      : undefined;
    return message;
  },
};

messageTypeRegistry.set(SatRpcResponse.$type, SatRpcResponse);

function createBaseSatAuthHeaderPair(): SatAuthHeaderPair {
  return { $type: "Electric.Satellite.SatAuthHeaderPair", key: 0, value: "" };
}

export const SatAuthHeaderPair = {
  $type: "Electric.Satellite.SatAuthHeaderPair" as const,

  encode(message: SatAuthHeaderPair, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.key !== 0) {
      writer.uint32(8).int32(message.key);
    }
    if (message.value !== "") {
      writer.uint32(18).string(message.value);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): SatAuthHeaderPair {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseSatAuthHeaderPair();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 8) {
            break;
          }

          message.key = reader.int32() as any;
          continue;
        case 2:
          if (tag !== 18) {
            break;
          }

          message.value = reader.string();
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  create<I extends Exact<DeepPartial<SatAuthHeaderPair>, I>>(base?: I): SatAuthHeaderPair {
    return SatAuthHeaderPair.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<SatAuthHeaderPair>, I>>(object: I): SatAuthHeaderPair {
    const message = createBaseSatAuthHeaderPair();
    message.key = object.key ?? 0;
    message.value = object.value ?? "";
    return message;
  },
};

messageTypeRegistry.set(SatAuthHeaderPair.$type, SatAuthHeaderPair);

function createBaseSatAuthReq(): SatAuthReq {
  return { $type: "Electric.Satellite.SatAuthReq", id: "", token: "", headers: [] };
}

export const SatAuthReq = {
  $type: "Electric.Satellite.SatAuthReq" as const,

  encode(message: SatAuthReq, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.id !== "") {
      writer.uint32(10).string(message.id);
    }
    if (message.token !== "") {
      writer.uint32(18).string(message.token);
    }
    for (const v of message.headers) {
      SatAuthHeaderPair.encode(v!, writer.uint32(26).fork()).ldelim();
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): SatAuthReq {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseSatAuthReq();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.id = reader.string();
          continue;
        case 2:
          if (tag !== 18) {
            break;
          }

          message.token = reader.string();
          continue;
        case 3:
          if (tag !== 26) {
            break;
          }

          message.headers.push(SatAuthHeaderPair.decode(reader, reader.uint32()));
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  create<I extends Exact<DeepPartial<SatAuthReq>, I>>(base?: I): SatAuthReq {
    return SatAuthReq.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<SatAuthReq>, I>>(object: I): SatAuthReq {
    const message = createBaseSatAuthReq();
    message.id = object.id ?? "";
    message.token = object.token ?? "";
    message.headers = object.headers?.map((e) => SatAuthHeaderPair.fromPartial(e)) || [];
    return message;
  },
};

messageTypeRegistry.set(SatAuthReq.$type, SatAuthReq);

function createBaseSatAuthResp(): SatAuthResp {
  return { $type: "Electric.Satellite.SatAuthResp", id: "", headers: [] };
}

export const SatAuthResp = {
  $type: "Electric.Satellite.SatAuthResp" as const,

  encode(message: SatAuthResp, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.id !== "") {
      writer.uint32(10).string(message.id);
    }
    for (const v of message.headers) {
      SatAuthHeaderPair.encode(v!, writer.uint32(26).fork()).ldelim();
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): SatAuthResp {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseSatAuthResp();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.id = reader.string();
          continue;
        case 3:
          if (tag !== 26) {
            break;
          }

          message.headers.push(SatAuthHeaderPair.decode(reader, reader.uint32()));
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  create<I extends Exact<DeepPartial<SatAuthResp>, I>>(base?: I): SatAuthResp {
    return SatAuthResp.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<SatAuthResp>, I>>(object: I): SatAuthResp {
    const message = createBaseSatAuthResp();
    message.id = object.id ?? "";
    message.headers = object.headers?.map((e) => SatAuthHeaderPair.fromPartial(e)) || [];
    return message;
  },
};

messageTypeRegistry.set(SatAuthResp.$type, SatAuthResp);

function createBaseSatErrorResp(): SatErrorResp {
  return { $type: "Electric.Satellite.SatErrorResp", errorType: 0, lsn: undefined, message: undefined };
}

export const SatErrorResp = {
  $type: "Electric.Satellite.SatErrorResp" as const,

  encode(message: SatErrorResp, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.errorType !== 0) {
      writer.uint32(8).int32(message.errorType);
    }
    if (message.lsn !== undefined) {
      writer.uint32(18).bytes(message.lsn);
    }
    if (message.message !== undefined) {
      writer.uint32(26).string(message.message);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): SatErrorResp {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseSatErrorResp();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 8) {
            break;
          }

          message.errorType = reader.int32() as any;
          continue;
        case 2:
          if (tag !== 18) {
            break;
          }

          message.lsn = reader.bytes();
          continue;
        case 3:
          if (tag !== 26) {
            break;
          }

          message.message = reader.string();
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  create<I extends Exact<DeepPartial<SatErrorResp>, I>>(base?: I): SatErrorResp {
    return SatErrorResp.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<SatErrorResp>, I>>(object: I): SatErrorResp {
    const message = createBaseSatErrorResp();
    message.errorType = object.errorType ?? 0;
    message.lsn = object.lsn ?? undefined;
    message.message = object.message ?? undefined;
    return message;
  },
};

messageTypeRegistry.set(SatErrorResp.$type, SatErrorResp);

function createBaseSatInStartReplicationReq(): SatInStartReplicationReq {
  return {
    $type: "Electric.Satellite.SatInStartReplicationReq",
    lsn: new Uint8Array(),
    options: [],
    subscriptionIds: [],
    schemaVersion: undefined,
  };
}

export const SatInStartReplicationReq = {
  $type: "Electric.Satellite.SatInStartReplicationReq" as const,

  encode(message: SatInStartReplicationReq, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.lsn.length !== 0) {
      writer.uint32(10).bytes(message.lsn);
    }
    writer.uint32(18).fork();
    for (const v of message.options) {
      writer.int32(v);
    }
    writer.ldelim();
    for (const v of message.subscriptionIds) {
      writer.uint32(34).string(v!);
    }
    if (message.schemaVersion !== undefined) {
      writer.uint32(42).string(message.schemaVersion);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): SatInStartReplicationReq {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseSatInStartReplicationReq();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.lsn = reader.bytes();
          continue;
        case 2:
          if (tag === 16) {
            message.options.push(reader.int32() as any);

            continue;
          }

          if (tag === 18) {
            const end2 = reader.uint32() + reader.pos;
            while (reader.pos < end2) {
              message.options.push(reader.int32() as any);
            }

            continue;
          }

          break;
        case 4:
          if (tag !== 34) {
            break;
          }

          message.subscriptionIds.push(reader.string());
          continue;
        case 5:
          if (tag !== 42) {
            break;
          }

          message.schemaVersion = reader.string();
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  create<I extends Exact<DeepPartial<SatInStartReplicationReq>, I>>(base?: I): SatInStartReplicationReq {
    return SatInStartReplicationReq.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<SatInStartReplicationReq>, I>>(object: I): SatInStartReplicationReq {
    const message = createBaseSatInStartReplicationReq();
    message.lsn = object.lsn ?? new Uint8Array();
    message.options = object.options?.map((e) => e) || [];
    message.subscriptionIds = object.subscriptionIds?.map((e) => e) || [];
    message.schemaVersion = object.schemaVersion ?? undefined;
    return message;
  },
};

messageTypeRegistry.set(SatInStartReplicationReq.$type, SatInStartReplicationReq);

function createBaseSatInStartReplicationResp(): SatInStartReplicationResp {
  return { $type: "Electric.Satellite.SatInStartReplicationResp", err: undefined };
}

export const SatInStartReplicationResp = {
  $type: "Electric.Satellite.SatInStartReplicationResp" as const,

  encode(message: SatInStartReplicationResp, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.err !== undefined) {
      SatInStartReplicationResp_ReplicationError.encode(message.err, writer.uint32(10).fork()).ldelim();
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): SatInStartReplicationResp {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseSatInStartReplicationResp();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.err = SatInStartReplicationResp_ReplicationError.decode(reader, reader.uint32());
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  create<I extends Exact<DeepPartial<SatInStartReplicationResp>, I>>(base?: I): SatInStartReplicationResp {
    return SatInStartReplicationResp.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<SatInStartReplicationResp>, I>>(object: I): SatInStartReplicationResp {
    const message = createBaseSatInStartReplicationResp();
    message.err = (object.err !== undefined && object.err !== null)
      ? SatInStartReplicationResp_ReplicationError.fromPartial(object.err)
      : undefined;
    return message;
  },
};

messageTypeRegistry.set(SatInStartReplicationResp.$type, SatInStartReplicationResp);

function createBaseSatInStartReplicationResp_ReplicationError(): SatInStartReplicationResp_ReplicationError {
  return { $type: "Electric.Satellite.SatInStartReplicationResp.ReplicationError", code: 0, message: "" };
}

export const SatInStartReplicationResp_ReplicationError = {
  $type: "Electric.Satellite.SatInStartReplicationResp.ReplicationError" as const,

  encode(message: SatInStartReplicationResp_ReplicationError, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.code !== 0) {
      writer.uint32(8).int32(message.code);
    }
    if (message.message !== "") {
      writer.uint32(18).string(message.message);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): SatInStartReplicationResp_ReplicationError {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseSatInStartReplicationResp_ReplicationError();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 8) {
            break;
          }

          message.code = reader.int32() as any;
          continue;
        case 2:
          if (tag !== 18) {
            break;
          }

          message.message = reader.string();
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  create<I extends Exact<DeepPartial<SatInStartReplicationResp_ReplicationError>, I>>(
    base?: I,
  ): SatInStartReplicationResp_ReplicationError {
    return SatInStartReplicationResp_ReplicationError.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<SatInStartReplicationResp_ReplicationError>, I>>(
    object: I,
  ): SatInStartReplicationResp_ReplicationError {
    const message = createBaseSatInStartReplicationResp_ReplicationError();
    message.code = object.code ?? 0;
    message.message = object.message ?? "";
    return message;
  },
};

messageTypeRegistry.set(SatInStartReplicationResp_ReplicationError.$type, SatInStartReplicationResp_ReplicationError);

function createBaseSatInStopReplicationReq(): SatInStopReplicationReq {
  return { $type: "Electric.Satellite.SatInStopReplicationReq" };
}

export const SatInStopReplicationReq = {
  $type: "Electric.Satellite.SatInStopReplicationReq" as const,

  encode(_: SatInStopReplicationReq, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): SatInStopReplicationReq {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseSatInStopReplicationReq();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  create<I extends Exact<DeepPartial<SatInStopReplicationReq>, I>>(base?: I): SatInStopReplicationReq {
    return SatInStopReplicationReq.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<SatInStopReplicationReq>, I>>(_: I): SatInStopReplicationReq {
    const message = createBaseSatInStopReplicationReq();
    return message;
  },
};

messageTypeRegistry.set(SatInStopReplicationReq.$type, SatInStopReplicationReq);

function createBaseSatInStopReplicationResp(): SatInStopReplicationResp {
  return { $type: "Electric.Satellite.SatInStopReplicationResp" };
}

export const SatInStopReplicationResp = {
  $type: "Electric.Satellite.SatInStopReplicationResp" as const,

  encode(_: SatInStopReplicationResp, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): SatInStopReplicationResp {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseSatInStopReplicationResp();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  create<I extends Exact<DeepPartial<SatInStopReplicationResp>, I>>(base?: I): SatInStopReplicationResp {
    return SatInStopReplicationResp.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<SatInStopReplicationResp>, I>>(_: I): SatInStopReplicationResp {
    const message = createBaseSatInStopReplicationResp();
    return message;
  },
};

messageTypeRegistry.set(SatInStopReplicationResp.$type, SatInStopReplicationResp);

function createBaseSatRelationColumn(): SatRelationColumn {
  return { $type: "Electric.Satellite.SatRelationColumn", name: "", type: "", primaryKey: false, isNullable: false };
}

export const SatRelationColumn = {
  $type: "Electric.Satellite.SatRelationColumn" as const,

  encode(message: SatRelationColumn, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.name !== "") {
      writer.uint32(10).string(message.name);
    }
    if (message.type !== "") {
      writer.uint32(18).string(message.type);
    }
    if (message.primaryKey === true) {
      writer.uint32(24).bool(message.primaryKey);
    }
    if (message.isNullable === true) {
      writer.uint32(32).bool(message.isNullable);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): SatRelationColumn {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseSatRelationColumn();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.name = reader.string();
          continue;
        case 2:
          if (tag !== 18) {
            break;
          }

          message.type = reader.string();
          continue;
        case 3:
          if (tag !== 24) {
            break;
          }

          message.primaryKey = reader.bool();
          continue;
        case 4:
          if (tag !== 32) {
            break;
          }

          message.isNullable = reader.bool();
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  create<I extends Exact<DeepPartial<SatRelationColumn>, I>>(base?: I): SatRelationColumn {
    return SatRelationColumn.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<SatRelationColumn>, I>>(object: I): SatRelationColumn {
    const message = createBaseSatRelationColumn();
    message.name = object.name ?? "";
    message.type = object.type ?? "";
    message.primaryKey = object.primaryKey ?? false;
    message.isNullable = object.isNullable ?? false;
    return message;
  },
};

messageTypeRegistry.set(SatRelationColumn.$type, SatRelationColumn);

function createBaseSatRelation(): SatRelation {
  return {
    $type: "Electric.Satellite.SatRelation",
    schemaName: "",
    tableType: 0,
    tableName: "",
    relationId: 0,
    columns: [],
  };
}

export const SatRelation = {
  $type: "Electric.Satellite.SatRelation" as const,

  encode(message: SatRelation, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.schemaName !== "") {
      writer.uint32(10).string(message.schemaName);
    }
    if (message.tableType !== 0) {
      writer.uint32(16).int32(message.tableType);
    }
    if (message.tableName !== "") {
      writer.uint32(26).string(message.tableName);
    }
    if (message.relationId !== 0) {
      writer.uint32(32).uint32(message.relationId);
    }
    for (const v of message.columns) {
      SatRelationColumn.encode(v!, writer.uint32(42).fork()).ldelim();
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): SatRelation {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseSatRelation();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.schemaName = reader.string();
          continue;
        case 2:
          if (tag !== 16) {
            break;
          }

          message.tableType = reader.int32() as any;
          continue;
        case 3:
          if (tag !== 26) {
            break;
          }

          message.tableName = reader.string();
          continue;
        case 4:
          if (tag !== 32) {
            break;
          }

          message.relationId = reader.uint32();
          continue;
        case 5:
          if (tag !== 42) {
            break;
          }

          message.columns.push(SatRelationColumn.decode(reader, reader.uint32()));
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  create<I extends Exact<DeepPartial<SatRelation>, I>>(base?: I): SatRelation {
    return SatRelation.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<SatRelation>, I>>(object: I): SatRelation {
    const message = createBaseSatRelation();
    message.schemaName = object.schemaName ?? "";
    message.tableType = object.tableType ?? 0;
    message.tableName = object.tableName ?? "";
    message.relationId = object.relationId ?? 0;
    message.columns = object.columns?.map((e) => SatRelationColumn.fromPartial(e)) || [];
    return message;
  },
};

messageTypeRegistry.set(SatRelation.$type, SatRelation);

function createBaseSatOpLog(): SatOpLog {
  return { $type: "Electric.Satellite.SatOpLog", ops: [] };
}

export const SatOpLog = {
  $type: "Electric.Satellite.SatOpLog" as const,

  encode(message: SatOpLog, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    for (const v of message.ops) {
      SatTransOp.encode(v!, writer.uint32(10).fork()).ldelim();
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): SatOpLog {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseSatOpLog();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.ops.push(SatTransOp.decode(reader, reader.uint32()));
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  create<I extends Exact<DeepPartial<SatOpLog>, I>>(base?: I): SatOpLog {
    return SatOpLog.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<SatOpLog>, I>>(object: I): SatOpLog {
    const message = createBaseSatOpLog();
    message.ops = object.ops?.map((e) => SatTransOp.fromPartial(e)) || [];
    return message;
  },
};

messageTypeRegistry.set(SatOpLog.$type, SatOpLog);

function createBaseSatTransOp(): SatTransOp {
  return {
    $type: "Electric.Satellite.SatTransOp",
    begin: undefined,
    commit: undefined,
    update: undefined,
    insert: undefined,
    delete: undefined,
    migrate: undefined,
    compensation: undefined,
  };
}

export const SatTransOp = {
  $type: "Electric.Satellite.SatTransOp" as const,

  encode(message: SatTransOp, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.begin !== undefined) {
      SatOpBegin.encode(message.begin, writer.uint32(10).fork()).ldelim();
    }
    if (message.commit !== undefined) {
      SatOpCommit.encode(message.commit, writer.uint32(18).fork()).ldelim();
    }
    if (message.update !== undefined) {
      SatOpUpdate.encode(message.update, writer.uint32(26).fork()).ldelim();
    }
    if (message.insert !== undefined) {
      SatOpInsert.encode(message.insert, writer.uint32(34).fork()).ldelim();
    }
    if (message.delete !== undefined) {
      SatOpDelete.encode(message.delete, writer.uint32(42).fork()).ldelim();
    }
    if (message.migrate !== undefined) {
      SatOpMigrate.encode(message.migrate, writer.uint32(50).fork()).ldelim();
    }
    if (message.compensation !== undefined) {
      SatOpCompensation.encode(message.compensation, writer.uint32(58).fork()).ldelim();
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): SatTransOp {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseSatTransOp();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.begin = SatOpBegin.decode(reader, reader.uint32());
          continue;
        case 2:
          if (tag !== 18) {
            break;
          }

          message.commit = SatOpCommit.decode(reader, reader.uint32());
          continue;
        case 3:
          if (tag !== 26) {
            break;
          }

          message.update = SatOpUpdate.decode(reader, reader.uint32());
          continue;
        case 4:
          if (tag !== 34) {
            break;
          }

          message.insert = SatOpInsert.decode(reader, reader.uint32());
          continue;
        case 5:
          if (tag !== 42) {
            break;
          }

          message.delete = SatOpDelete.decode(reader, reader.uint32());
          continue;
        case 6:
          if (tag !== 50) {
            break;
          }

          message.migrate = SatOpMigrate.decode(reader, reader.uint32());
          continue;
        case 7:
          if (tag !== 58) {
            break;
          }

          message.compensation = SatOpCompensation.decode(reader, reader.uint32());
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  create<I extends Exact<DeepPartial<SatTransOp>, I>>(base?: I): SatTransOp {
    return SatTransOp.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<SatTransOp>, I>>(object: I): SatTransOp {
    const message = createBaseSatTransOp();
    message.begin = (object.begin !== undefined && object.begin !== null)
      ? SatOpBegin.fromPartial(object.begin)
      : undefined;
    message.commit = (object.commit !== undefined && object.commit !== null)
      ? SatOpCommit.fromPartial(object.commit)
      : undefined;
    message.update = (object.update !== undefined && object.update !== null)
      ? SatOpUpdate.fromPartial(object.update)
      : undefined;
    message.insert = (object.insert !== undefined && object.insert !== null)
      ? SatOpInsert.fromPartial(object.insert)
      : undefined;
    message.delete = (object.delete !== undefined && object.delete !== null)
      ? SatOpDelete.fromPartial(object.delete)
      : undefined;
    message.migrate = (object.migrate !== undefined && object.migrate !== null)
      ? SatOpMigrate.fromPartial(object.migrate)
      : undefined;
    message.compensation = (object.compensation !== undefined && object.compensation !== null)
      ? SatOpCompensation.fromPartial(object.compensation)
      : undefined;
    return message;
  },
};

messageTypeRegistry.set(SatTransOp.$type, SatTransOp);

function createBaseSatOpBegin(): SatOpBegin {
  return {
    $type: "Electric.Satellite.SatOpBegin",
    commitTimestamp: Long.UZERO,
    transId: "",
    lsn: new Uint8Array(),
    origin: undefined,
    isMigration: false,
  };
}

export const SatOpBegin = {
  $type: "Electric.Satellite.SatOpBegin" as const,

  encode(message: SatOpBegin, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (!message.commitTimestamp.isZero()) {
      writer.uint32(8).uint64(message.commitTimestamp);
    }
    if (message.transId !== "") {
      writer.uint32(18).string(message.transId);
    }
    if (message.lsn.length !== 0) {
      writer.uint32(26).bytes(message.lsn);
    }
    if (message.origin !== undefined) {
      writer.uint32(34).string(message.origin);
    }
    if (message.isMigration === true) {
      writer.uint32(40).bool(message.isMigration);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): SatOpBegin {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseSatOpBegin();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 8) {
            break;
          }

          message.commitTimestamp = reader.uint64() as Long;
          continue;
        case 2:
          if (tag !== 18) {
            break;
          }

          message.transId = reader.string();
          continue;
        case 3:
          if (tag !== 26) {
            break;
          }

          message.lsn = reader.bytes();
          continue;
        case 4:
          if (tag !== 34) {
            break;
          }

          message.origin = reader.string();
          continue;
        case 5:
          if (tag !== 40) {
            break;
          }

          message.isMigration = reader.bool();
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  create<I extends Exact<DeepPartial<SatOpBegin>, I>>(base?: I): SatOpBegin {
    return SatOpBegin.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<SatOpBegin>, I>>(object: I): SatOpBegin {
    const message = createBaseSatOpBegin();
    message.commitTimestamp = (object.commitTimestamp !== undefined && object.commitTimestamp !== null)
      ? Long.fromValue(object.commitTimestamp)
      : Long.UZERO;
    message.transId = object.transId ?? "";
    message.lsn = object.lsn ?? new Uint8Array();
    message.origin = object.origin ?? undefined;
    message.isMigration = object.isMigration ?? false;
    return message;
  },
};

messageTypeRegistry.set(SatOpBegin.$type, SatOpBegin);

function createBaseSatOpCommit(): SatOpCommit {
  return { $type: "Electric.Satellite.SatOpCommit", commitTimestamp: Long.UZERO, transId: "", lsn: new Uint8Array() };
}

export const SatOpCommit = {
  $type: "Electric.Satellite.SatOpCommit" as const,

  encode(message: SatOpCommit, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (!message.commitTimestamp.isZero()) {
      writer.uint32(8).uint64(message.commitTimestamp);
    }
    if (message.transId !== "") {
      writer.uint32(18).string(message.transId);
    }
    if (message.lsn.length !== 0) {
      writer.uint32(26).bytes(message.lsn);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): SatOpCommit {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseSatOpCommit();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 8) {
            break;
          }

          message.commitTimestamp = reader.uint64() as Long;
          continue;
        case 2:
          if (tag !== 18) {
            break;
          }

          message.transId = reader.string();
          continue;
        case 3:
          if (tag !== 26) {
            break;
          }

          message.lsn = reader.bytes();
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  create<I extends Exact<DeepPartial<SatOpCommit>, I>>(base?: I): SatOpCommit {
    return SatOpCommit.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<SatOpCommit>, I>>(object: I): SatOpCommit {
    const message = createBaseSatOpCommit();
    message.commitTimestamp = (object.commitTimestamp !== undefined && object.commitTimestamp !== null)
      ? Long.fromValue(object.commitTimestamp)
      : Long.UZERO;
    message.transId = object.transId ?? "";
    message.lsn = object.lsn ?? new Uint8Array();
    return message;
  },
};

messageTypeRegistry.set(SatOpCommit.$type, SatOpCommit);

function createBaseSatOpInsert(): SatOpInsert {
  return { $type: "Electric.Satellite.SatOpInsert", relationId: 0, rowData: undefined, tags: [] };
}

export const SatOpInsert = {
  $type: "Electric.Satellite.SatOpInsert" as const,

  encode(message: SatOpInsert, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.relationId !== 0) {
      writer.uint32(8).uint32(message.relationId);
    }
    if (message.rowData !== undefined) {
      SatOpRow.encode(message.rowData, writer.uint32(18).fork()).ldelim();
    }
    for (const v of message.tags) {
      writer.uint32(26).string(v!);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): SatOpInsert {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseSatOpInsert();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 8) {
            break;
          }

          message.relationId = reader.uint32();
          continue;
        case 2:
          if (tag !== 18) {
            break;
          }

          message.rowData = SatOpRow.decode(reader, reader.uint32());
          continue;
        case 3:
          if (tag !== 26) {
            break;
          }

          message.tags.push(reader.string());
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  create<I extends Exact<DeepPartial<SatOpInsert>, I>>(base?: I): SatOpInsert {
    return SatOpInsert.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<SatOpInsert>, I>>(object: I): SatOpInsert {
    const message = createBaseSatOpInsert();
    message.relationId = object.relationId ?? 0;
    message.rowData = (object.rowData !== undefined && object.rowData !== null)
      ? SatOpRow.fromPartial(object.rowData)
      : undefined;
    message.tags = object.tags?.map((e) => e) || [];
    return message;
  },
};

messageTypeRegistry.set(SatOpInsert.$type, SatOpInsert);

function createBaseSatOpUpdate(): SatOpUpdate {
  return {
    $type: "Electric.Satellite.SatOpUpdate",
    relationId: 0,
    rowData: undefined,
    oldRowData: undefined,
    tags: [],
  };
}

export const SatOpUpdate = {
  $type: "Electric.Satellite.SatOpUpdate" as const,

  encode(message: SatOpUpdate, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.relationId !== 0) {
      writer.uint32(8).uint32(message.relationId);
    }
    if (message.rowData !== undefined) {
      SatOpRow.encode(message.rowData, writer.uint32(18).fork()).ldelim();
    }
    if (message.oldRowData !== undefined) {
      SatOpRow.encode(message.oldRowData, writer.uint32(26).fork()).ldelim();
    }
    for (const v of message.tags) {
      writer.uint32(34).string(v!);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): SatOpUpdate {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseSatOpUpdate();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 8) {
            break;
          }

          message.relationId = reader.uint32();
          continue;
        case 2:
          if (tag !== 18) {
            break;
          }

          message.rowData = SatOpRow.decode(reader, reader.uint32());
          continue;
        case 3:
          if (tag !== 26) {
            break;
          }

          message.oldRowData = SatOpRow.decode(reader, reader.uint32());
          continue;
        case 4:
          if (tag !== 34) {
            break;
          }

          message.tags.push(reader.string());
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  create<I extends Exact<DeepPartial<SatOpUpdate>, I>>(base?: I): SatOpUpdate {
    return SatOpUpdate.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<SatOpUpdate>, I>>(object: I): SatOpUpdate {
    const message = createBaseSatOpUpdate();
    message.relationId = object.relationId ?? 0;
    message.rowData = (object.rowData !== undefined && object.rowData !== null)
      ? SatOpRow.fromPartial(object.rowData)
      : undefined;
    message.oldRowData = (object.oldRowData !== undefined && object.oldRowData !== null)
      ? SatOpRow.fromPartial(object.oldRowData)
      : undefined;
    message.tags = object.tags?.map((e) => e) || [];
    return message;
  },
};

messageTypeRegistry.set(SatOpUpdate.$type, SatOpUpdate);

function createBaseSatOpDelete(): SatOpDelete {
  return { $type: "Electric.Satellite.SatOpDelete", relationId: 0, oldRowData: undefined, tags: [] };
}

export const SatOpDelete = {
  $type: "Electric.Satellite.SatOpDelete" as const,

  encode(message: SatOpDelete, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.relationId !== 0) {
      writer.uint32(8).uint32(message.relationId);
    }
    if (message.oldRowData !== undefined) {
      SatOpRow.encode(message.oldRowData, writer.uint32(18).fork()).ldelim();
    }
    for (const v of message.tags) {
      writer.uint32(26).string(v!);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): SatOpDelete {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseSatOpDelete();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 8) {
            break;
          }

          message.relationId = reader.uint32();
          continue;
        case 2:
          if (tag !== 18) {
            break;
          }

          message.oldRowData = SatOpRow.decode(reader, reader.uint32());
          continue;
        case 3:
          if (tag !== 26) {
            break;
          }

          message.tags.push(reader.string());
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  create<I extends Exact<DeepPartial<SatOpDelete>, I>>(base?: I): SatOpDelete {
    return SatOpDelete.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<SatOpDelete>, I>>(object: I): SatOpDelete {
    const message = createBaseSatOpDelete();
    message.relationId = object.relationId ?? 0;
    message.oldRowData = (object.oldRowData !== undefined && object.oldRowData !== null)
      ? SatOpRow.fromPartial(object.oldRowData)
      : undefined;
    message.tags = object.tags?.map((e) => e) || [];
    return message;
  },
};

messageTypeRegistry.set(SatOpDelete.$type, SatOpDelete);

function createBaseSatOpCompensation(): SatOpCompensation {
  return { $type: "Electric.Satellite.SatOpCompensation", relationId: 0, pkData: undefined, tags: [] };
}

export const SatOpCompensation = {
  $type: "Electric.Satellite.SatOpCompensation" as const,

  encode(message: SatOpCompensation, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.relationId !== 0) {
      writer.uint32(8).uint32(message.relationId);
    }
    if (message.pkData !== undefined) {
      SatOpRow.encode(message.pkData, writer.uint32(18).fork()).ldelim();
    }
    for (const v of message.tags) {
      writer.uint32(34).string(v!);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): SatOpCompensation {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseSatOpCompensation();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 8) {
            break;
          }

          message.relationId = reader.uint32();
          continue;
        case 2:
          if (tag !== 18) {
            break;
          }

          message.pkData = SatOpRow.decode(reader, reader.uint32());
          continue;
        case 4:
          if (tag !== 34) {
            break;
          }

          message.tags.push(reader.string());
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  create<I extends Exact<DeepPartial<SatOpCompensation>, I>>(base?: I): SatOpCompensation {
    return SatOpCompensation.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<SatOpCompensation>, I>>(object: I): SatOpCompensation {
    const message = createBaseSatOpCompensation();
    message.relationId = object.relationId ?? 0;
    message.pkData = (object.pkData !== undefined && object.pkData !== null)
      ? SatOpRow.fromPartial(object.pkData)
      : undefined;
    message.tags = object.tags?.map((e) => e) || [];
    return message;
  },
};

messageTypeRegistry.set(SatOpCompensation.$type, SatOpCompensation);

function createBaseSatOpRow(): SatOpRow {
  return { $type: "Electric.Satellite.SatOpRow", nullsBitmask: new Uint8Array(), values: [] };
}

export const SatOpRow = {
  $type: "Electric.Satellite.SatOpRow" as const,

  encode(message: SatOpRow, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.nullsBitmask.length !== 0) {
      writer.uint32(10).bytes(message.nullsBitmask);
    }
    for (const v of message.values) {
      writer.uint32(18).bytes(v!);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): SatOpRow {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseSatOpRow();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.nullsBitmask = reader.bytes();
          continue;
        case 2:
          if (tag !== 18) {
            break;
          }

          message.values.push(reader.bytes());
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  create<I extends Exact<DeepPartial<SatOpRow>, I>>(base?: I): SatOpRow {
    return SatOpRow.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<SatOpRow>, I>>(object: I): SatOpRow {
    const message = createBaseSatOpRow();
    message.nullsBitmask = object.nullsBitmask ?? new Uint8Array();
    message.values = object.values?.map((e) => e) || [];
    return message;
  },
};

messageTypeRegistry.set(SatOpRow.$type, SatOpRow);

function createBaseSatOpMigrate(): SatOpMigrate {
  return { $type: "Electric.Satellite.SatOpMigrate", version: "", stmts: [], table: undefined };
}

export const SatOpMigrate = {
  $type: "Electric.Satellite.SatOpMigrate" as const,

  encode(message: SatOpMigrate, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.version !== "") {
      writer.uint32(10).string(message.version);
    }
    for (const v of message.stmts) {
      SatOpMigrate_Stmt.encode(v!, writer.uint32(18).fork()).ldelim();
    }
    if (message.table !== undefined) {
      SatOpMigrate_Table.encode(message.table, writer.uint32(26).fork()).ldelim();
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): SatOpMigrate {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseSatOpMigrate();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.version = reader.string();
          continue;
        case 2:
          if (tag !== 18) {
            break;
          }

          message.stmts.push(SatOpMigrate_Stmt.decode(reader, reader.uint32()));
          continue;
        case 3:
          if (tag !== 26) {
            break;
          }

          message.table = SatOpMigrate_Table.decode(reader, reader.uint32());
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  create<I extends Exact<DeepPartial<SatOpMigrate>, I>>(base?: I): SatOpMigrate {
    return SatOpMigrate.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<SatOpMigrate>, I>>(object: I): SatOpMigrate {
    const message = createBaseSatOpMigrate();
    message.version = object.version ?? "";
    message.stmts = object.stmts?.map((e) => SatOpMigrate_Stmt.fromPartial(e)) || [];
    message.table = (object.table !== undefined && object.table !== null)
      ? SatOpMigrate_Table.fromPartial(object.table)
      : undefined;
    return message;
  },
};

messageTypeRegistry.set(SatOpMigrate.$type, SatOpMigrate);

function createBaseSatOpMigrate_Stmt(): SatOpMigrate_Stmt {
  return { $type: "Electric.Satellite.SatOpMigrate.Stmt", type: 0, sql: "" };
}

export const SatOpMigrate_Stmt = {
  $type: "Electric.Satellite.SatOpMigrate.Stmt" as const,

  encode(message: SatOpMigrate_Stmt, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.type !== 0) {
      writer.uint32(8).int32(message.type);
    }
    if (message.sql !== "") {
      writer.uint32(18).string(message.sql);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): SatOpMigrate_Stmt {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseSatOpMigrate_Stmt();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 8) {
            break;
          }

          message.type = reader.int32() as any;
          continue;
        case 2:
          if (tag !== 18) {
            break;
          }

          message.sql = reader.string();
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  create<I extends Exact<DeepPartial<SatOpMigrate_Stmt>, I>>(base?: I): SatOpMigrate_Stmt {
    return SatOpMigrate_Stmt.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<SatOpMigrate_Stmt>, I>>(object: I): SatOpMigrate_Stmt {
    const message = createBaseSatOpMigrate_Stmt();
    message.type = object.type ?? 0;
    message.sql = object.sql ?? "";
    return message;
  },
};

messageTypeRegistry.set(SatOpMigrate_Stmt.$type, SatOpMigrate_Stmt);

function createBaseSatOpMigrate_PgColumnType(): SatOpMigrate_PgColumnType {
  return { $type: "Electric.Satellite.SatOpMigrate.PgColumnType", name: "", array: [], size: [] };
}

export const SatOpMigrate_PgColumnType = {
  $type: "Electric.Satellite.SatOpMigrate.PgColumnType" as const,

  encode(message: SatOpMigrate_PgColumnType, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.name !== "") {
      writer.uint32(10).string(message.name);
    }
    writer.uint32(18).fork();
    for (const v of message.array) {
      writer.int32(v);
    }
    writer.ldelim();
    writer.uint32(26).fork();
    for (const v of message.size) {
      writer.int32(v);
    }
    writer.ldelim();
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): SatOpMigrate_PgColumnType {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseSatOpMigrate_PgColumnType();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.name = reader.string();
          continue;
        case 2:
          if (tag === 16) {
            message.array.push(reader.int32());

            continue;
          }

          if (tag === 18) {
            const end2 = reader.uint32() + reader.pos;
            while (reader.pos < end2) {
              message.array.push(reader.int32());
            }

            continue;
          }

          break;
        case 3:
          if (tag === 24) {
            message.size.push(reader.int32());

            continue;
          }

          if (tag === 26) {
            const end2 = reader.uint32() + reader.pos;
            while (reader.pos < end2) {
              message.size.push(reader.int32());
            }

            continue;
          }

          break;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  create<I extends Exact<DeepPartial<SatOpMigrate_PgColumnType>, I>>(base?: I): SatOpMigrate_PgColumnType {
    return SatOpMigrate_PgColumnType.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<SatOpMigrate_PgColumnType>, I>>(object: I): SatOpMigrate_PgColumnType {
    const message = createBaseSatOpMigrate_PgColumnType();
    message.name = object.name ?? "";
    message.array = object.array?.map((e) => e) || [];
    message.size = object.size?.map((e) => e) || [];
    return message;
  },
};

messageTypeRegistry.set(SatOpMigrate_PgColumnType.$type, SatOpMigrate_PgColumnType);

function createBaseSatOpMigrate_Column(): SatOpMigrate_Column {
  return { $type: "Electric.Satellite.SatOpMigrate.Column", name: "", sqliteType: "", pgType: undefined };
}

export const SatOpMigrate_Column = {
  $type: "Electric.Satellite.SatOpMigrate.Column" as const,

  encode(message: SatOpMigrate_Column, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.name !== "") {
      writer.uint32(10).string(message.name);
    }
    if (message.sqliteType !== "") {
      writer.uint32(18).string(message.sqliteType);
    }
    if (message.pgType !== undefined) {
      SatOpMigrate_PgColumnType.encode(message.pgType, writer.uint32(26).fork()).ldelim();
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): SatOpMigrate_Column {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseSatOpMigrate_Column();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.name = reader.string();
          continue;
        case 2:
          if (tag !== 18) {
            break;
          }

          message.sqliteType = reader.string();
          continue;
        case 3:
          if (tag !== 26) {
            break;
          }

          message.pgType = SatOpMigrate_PgColumnType.decode(reader, reader.uint32());
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  create<I extends Exact<DeepPartial<SatOpMigrate_Column>, I>>(base?: I): SatOpMigrate_Column {
    return SatOpMigrate_Column.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<SatOpMigrate_Column>, I>>(object: I): SatOpMigrate_Column {
    const message = createBaseSatOpMigrate_Column();
    message.name = object.name ?? "";
    message.sqliteType = object.sqliteType ?? "";
    message.pgType = (object.pgType !== undefined && object.pgType !== null)
      ? SatOpMigrate_PgColumnType.fromPartial(object.pgType)
      : undefined;
    return message;
  },
};

messageTypeRegistry.set(SatOpMigrate_Column.$type, SatOpMigrate_Column);

function createBaseSatOpMigrate_ForeignKey(): SatOpMigrate_ForeignKey {
  return { $type: "Electric.Satellite.SatOpMigrate.ForeignKey", fkCols: [], pkTable: "", pkCols: [] };
}

export const SatOpMigrate_ForeignKey = {
  $type: "Electric.Satellite.SatOpMigrate.ForeignKey" as const,

  encode(message: SatOpMigrate_ForeignKey, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    for (const v of message.fkCols) {
      writer.uint32(10).string(v!);
    }
    if (message.pkTable !== "") {
      writer.uint32(18).string(message.pkTable);
    }
    for (const v of message.pkCols) {
      writer.uint32(26).string(v!);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): SatOpMigrate_ForeignKey {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseSatOpMigrate_ForeignKey();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.fkCols.push(reader.string());
          continue;
        case 2:
          if (tag !== 18) {
            break;
          }

          message.pkTable = reader.string();
          continue;
        case 3:
          if (tag !== 26) {
            break;
          }

          message.pkCols.push(reader.string());
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  create<I extends Exact<DeepPartial<SatOpMigrate_ForeignKey>, I>>(base?: I): SatOpMigrate_ForeignKey {
    return SatOpMigrate_ForeignKey.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<SatOpMigrate_ForeignKey>, I>>(object: I): SatOpMigrate_ForeignKey {
    const message = createBaseSatOpMigrate_ForeignKey();
    message.fkCols = object.fkCols?.map((e) => e) || [];
    message.pkTable = object.pkTable ?? "";
    message.pkCols = object.pkCols?.map((e) => e) || [];
    return message;
  },
};

messageTypeRegistry.set(SatOpMigrate_ForeignKey.$type, SatOpMigrate_ForeignKey);

function createBaseSatOpMigrate_Table(): SatOpMigrate_Table {
  return { $type: "Electric.Satellite.SatOpMigrate.Table", name: "", columns: [], fks: [], pks: [] };
}

export const SatOpMigrate_Table = {
  $type: "Electric.Satellite.SatOpMigrate.Table" as const,

  encode(message: SatOpMigrate_Table, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.name !== "") {
      writer.uint32(10).string(message.name);
    }
    for (const v of message.columns) {
      SatOpMigrate_Column.encode(v!, writer.uint32(18).fork()).ldelim();
    }
    for (const v of message.fks) {
      SatOpMigrate_ForeignKey.encode(v!, writer.uint32(26).fork()).ldelim();
    }
    for (const v of message.pks) {
      writer.uint32(34).string(v!);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): SatOpMigrate_Table {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseSatOpMigrate_Table();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.name = reader.string();
          continue;
        case 2:
          if (tag !== 18) {
            break;
          }

          message.columns.push(SatOpMigrate_Column.decode(reader, reader.uint32()));
          continue;
        case 3:
          if (tag !== 26) {
            break;
          }

          message.fks.push(SatOpMigrate_ForeignKey.decode(reader, reader.uint32()));
          continue;
        case 4:
          if (tag !== 34) {
            break;
          }

          message.pks.push(reader.string());
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  create<I extends Exact<DeepPartial<SatOpMigrate_Table>, I>>(base?: I): SatOpMigrate_Table {
    return SatOpMigrate_Table.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<SatOpMigrate_Table>, I>>(object: I): SatOpMigrate_Table {
    const message = createBaseSatOpMigrate_Table();
    message.name = object.name ?? "";
    message.columns = object.columns?.map((e) => SatOpMigrate_Column.fromPartial(e)) || [];
    message.fks = object.fks?.map((e) => SatOpMigrate_ForeignKey.fromPartial(e)) || [];
    message.pks = object.pks?.map((e) => e) || [];
    return message;
  },
};

messageTypeRegistry.set(SatOpMigrate_Table.$type, SatOpMigrate_Table);

function createBaseSatSubsReq(): SatSubsReq {
  return { $type: "Electric.Satellite.SatSubsReq", subscriptionId: "", shapeRequests: [] };
}

export const SatSubsReq = {
  $type: "Electric.Satellite.SatSubsReq" as const,

  encode(message: SatSubsReq, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.subscriptionId !== "") {
      writer.uint32(10).string(message.subscriptionId);
    }
    for (const v of message.shapeRequests) {
      SatShapeReq.encode(v!, writer.uint32(18).fork()).ldelim();
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): SatSubsReq {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseSatSubsReq();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.subscriptionId = reader.string();
          continue;
        case 2:
          if (tag !== 18) {
            break;
          }

          message.shapeRequests.push(SatShapeReq.decode(reader, reader.uint32()));
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  create<I extends Exact<DeepPartial<SatSubsReq>, I>>(base?: I): SatSubsReq {
    return SatSubsReq.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<SatSubsReq>, I>>(object: I): SatSubsReq {
    const message = createBaseSatSubsReq();
    message.subscriptionId = object.subscriptionId ?? "";
    message.shapeRequests = object.shapeRequests?.map((e) => SatShapeReq.fromPartial(e)) || [];
    return message;
  },
};

messageTypeRegistry.set(SatSubsReq.$type, SatSubsReq);

function createBaseSatSubsResp(): SatSubsResp {
  return { $type: "Electric.Satellite.SatSubsResp", subscriptionId: "", err: undefined };
}

export const SatSubsResp = {
  $type: "Electric.Satellite.SatSubsResp" as const,

  encode(message: SatSubsResp, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.subscriptionId !== "") {
      writer.uint32(10).string(message.subscriptionId);
    }
    if (message.err !== undefined) {
      SatSubsResp_SatSubsError.encode(message.err, writer.uint32(18).fork()).ldelim();
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): SatSubsResp {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseSatSubsResp();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.subscriptionId = reader.string();
          continue;
        case 2:
          if (tag !== 18) {
            break;
          }

          message.err = SatSubsResp_SatSubsError.decode(reader, reader.uint32());
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  create<I extends Exact<DeepPartial<SatSubsResp>, I>>(base?: I): SatSubsResp {
    return SatSubsResp.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<SatSubsResp>, I>>(object: I): SatSubsResp {
    const message = createBaseSatSubsResp();
    message.subscriptionId = object.subscriptionId ?? "";
    message.err = (object.err !== undefined && object.err !== null)
      ? SatSubsResp_SatSubsError.fromPartial(object.err)
      : undefined;
    return message;
  },
};

messageTypeRegistry.set(SatSubsResp.$type, SatSubsResp);

function createBaseSatSubsResp_SatSubsError(): SatSubsResp_SatSubsError {
  return { $type: "Electric.Satellite.SatSubsResp.SatSubsError", code: 0, message: "", shapeRequestError: [] };
}

export const SatSubsResp_SatSubsError = {
  $type: "Electric.Satellite.SatSubsResp.SatSubsError" as const,

  encode(message: SatSubsResp_SatSubsError, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.code !== 0) {
      writer.uint32(16).int32(message.code);
    }
    if (message.message !== "") {
      writer.uint32(26).string(message.message);
    }
    for (const v of message.shapeRequestError) {
      SatSubsResp_SatSubsError_ShapeReqError.encode(v!, writer.uint32(34).fork()).ldelim();
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): SatSubsResp_SatSubsError {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseSatSubsResp_SatSubsError();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 2:
          if (tag !== 16) {
            break;
          }

          message.code = reader.int32() as any;
          continue;
        case 3:
          if (tag !== 26) {
            break;
          }

          message.message = reader.string();
          continue;
        case 4:
          if (tag !== 34) {
            break;
          }

          message.shapeRequestError.push(SatSubsResp_SatSubsError_ShapeReqError.decode(reader, reader.uint32()));
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  create<I extends Exact<DeepPartial<SatSubsResp_SatSubsError>, I>>(base?: I): SatSubsResp_SatSubsError {
    return SatSubsResp_SatSubsError.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<SatSubsResp_SatSubsError>, I>>(object: I): SatSubsResp_SatSubsError {
    const message = createBaseSatSubsResp_SatSubsError();
    message.code = object.code ?? 0;
    message.message = object.message ?? "";
    message.shapeRequestError =
      object.shapeRequestError?.map((e) => SatSubsResp_SatSubsError_ShapeReqError.fromPartial(e)) || [];
    return message;
  },
};

messageTypeRegistry.set(SatSubsResp_SatSubsError.$type, SatSubsResp_SatSubsError);

function createBaseSatSubsResp_SatSubsError_ShapeReqError(): SatSubsResp_SatSubsError_ShapeReqError {
  return { $type: "Electric.Satellite.SatSubsResp.SatSubsError.ShapeReqError", code: 0, message: "", requestId: "" };
}

export const SatSubsResp_SatSubsError_ShapeReqError = {
  $type: "Electric.Satellite.SatSubsResp.SatSubsError.ShapeReqError" as const,

  encode(message: SatSubsResp_SatSubsError_ShapeReqError, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.code !== 0) {
      writer.uint32(8).int32(message.code);
    }
    if (message.message !== "") {
      writer.uint32(18).string(message.message);
    }
    if (message.requestId !== "") {
      writer.uint32(26).string(message.requestId);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): SatSubsResp_SatSubsError_ShapeReqError {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseSatSubsResp_SatSubsError_ShapeReqError();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 8) {
            break;
          }

          message.code = reader.int32() as any;
          continue;
        case 2:
          if (tag !== 18) {
            break;
          }

          message.message = reader.string();
          continue;
        case 3:
          if (tag !== 26) {
            break;
          }

          message.requestId = reader.string();
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  create<I extends Exact<DeepPartial<SatSubsResp_SatSubsError_ShapeReqError>, I>>(
    base?: I,
  ): SatSubsResp_SatSubsError_ShapeReqError {
    return SatSubsResp_SatSubsError_ShapeReqError.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<SatSubsResp_SatSubsError_ShapeReqError>, I>>(
    object: I,
  ): SatSubsResp_SatSubsError_ShapeReqError {
    const message = createBaseSatSubsResp_SatSubsError_ShapeReqError();
    message.code = object.code ?? 0;
    message.message = object.message ?? "";
    message.requestId = object.requestId ?? "";
    return message;
  },
};

messageTypeRegistry.set(SatSubsResp_SatSubsError_ShapeReqError.$type, SatSubsResp_SatSubsError_ShapeReqError);

function createBaseSatUnsubsReq(): SatUnsubsReq {
  return { $type: "Electric.Satellite.SatUnsubsReq", subscriptionIds: [] };
}

export const SatUnsubsReq = {
  $type: "Electric.Satellite.SatUnsubsReq" as const,

  encode(message: SatUnsubsReq, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    for (const v of message.subscriptionIds) {
      writer.uint32(10).string(v!);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): SatUnsubsReq {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseSatUnsubsReq();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.subscriptionIds.push(reader.string());
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  create<I extends Exact<DeepPartial<SatUnsubsReq>, I>>(base?: I): SatUnsubsReq {
    return SatUnsubsReq.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<SatUnsubsReq>, I>>(object: I): SatUnsubsReq {
    const message = createBaseSatUnsubsReq();
    message.subscriptionIds = object.subscriptionIds?.map((e) => e) || [];
    return message;
  },
};

messageTypeRegistry.set(SatUnsubsReq.$type, SatUnsubsReq);

function createBaseSatUnsubsResp(): SatUnsubsResp {
  return { $type: "Electric.Satellite.SatUnsubsResp" };
}

export const SatUnsubsResp = {
  $type: "Electric.Satellite.SatUnsubsResp" as const,

  encode(_: SatUnsubsResp, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): SatUnsubsResp {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseSatUnsubsResp();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  create<I extends Exact<DeepPartial<SatUnsubsResp>, I>>(base?: I): SatUnsubsResp {
    return SatUnsubsResp.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<SatUnsubsResp>, I>>(_: I): SatUnsubsResp {
    const message = createBaseSatUnsubsResp();
    return message;
  },
};

messageTypeRegistry.set(SatUnsubsResp.$type, SatUnsubsResp);

function createBaseSatShapeReq(): SatShapeReq {
  return { $type: "Electric.Satellite.SatShapeReq", requestId: "", shapeDefinition: undefined };
}

export const SatShapeReq = {
  $type: "Electric.Satellite.SatShapeReq" as const,

  encode(message: SatShapeReq, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.requestId !== "") {
      writer.uint32(10).string(message.requestId);
    }
    if (message.shapeDefinition !== undefined) {
      SatShapeDef.encode(message.shapeDefinition, writer.uint32(18).fork()).ldelim();
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): SatShapeReq {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseSatShapeReq();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.requestId = reader.string();
          continue;
        case 2:
          if (tag !== 18) {
            break;
          }

          message.shapeDefinition = SatShapeDef.decode(reader, reader.uint32());
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  create<I extends Exact<DeepPartial<SatShapeReq>, I>>(base?: I): SatShapeReq {
    return SatShapeReq.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<SatShapeReq>, I>>(object: I): SatShapeReq {
    const message = createBaseSatShapeReq();
    message.requestId = object.requestId ?? "";
    message.shapeDefinition = (object.shapeDefinition !== undefined && object.shapeDefinition !== null)
      ? SatShapeDef.fromPartial(object.shapeDefinition)
      : undefined;
    return message;
  },
};

messageTypeRegistry.set(SatShapeReq.$type, SatShapeReq);

function createBaseSatShapeDef(): SatShapeDef {
  return { $type: "Electric.Satellite.SatShapeDef", selects: [] };
}

export const SatShapeDef = {
  $type: "Electric.Satellite.SatShapeDef" as const,

  encode(message: SatShapeDef, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    for (const v of message.selects) {
      SatShapeDef_Select.encode(v!, writer.uint32(10).fork()).ldelim();
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): SatShapeDef {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseSatShapeDef();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.selects.push(SatShapeDef_Select.decode(reader, reader.uint32()));
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  create<I extends Exact<DeepPartial<SatShapeDef>, I>>(base?: I): SatShapeDef {
    return SatShapeDef.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<SatShapeDef>, I>>(object: I): SatShapeDef {
    const message = createBaseSatShapeDef();
    message.selects = object.selects?.map((e) => SatShapeDef_Select.fromPartial(e)) || [];
    return message;
  },
};

messageTypeRegistry.set(SatShapeDef.$type, SatShapeDef);

function createBaseSatShapeDef_Select(): SatShapeDef_Select {
  return { $type: "Electric.Satellite.SatShapeDef.Select", tablename: "" };
}

export const SatShapeDef_Select = {
  $type: "Electric.Satellite.SatShapeDef.Select" as const,

  encode(message: SatShapeDef_Select, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.tablename !== "") {
      writer.uint32(10).string(message.tablename);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): SatShapeDef_Select {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseSatShapeDef_Select();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.tablename = reader.string();
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  create<I extends Exact<DeepPartial<SatShapeDef_Select>, I>>(base?: I): SatShapeDef_Select {
    return SatShapeDef_Select.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<SatShapeDef_Select>, I>>(object: I): SatShapeDef_Select {
    const message = createBaseSatShapeDef_Select();
    message.tablename = object.tablename ?? "";
    return message;
  },
};

messageTypeRegistry.set(SatShapeDef_Select.$type, SatShapeDef_Select);

function createBaseSatSubsDataError(): SatSubsDataError {
  return {
    $type: "Electric.Satellite.SatSubsDataError",
    code: 0,
    message: "",
    subscriptionId: "",
    shapeRequestError: [],
  };
}

export const SatSubsDataError = {
  $type: "Electric.Satellite.SatSubsDataError" as const,

  encode(message: SatSubsDataError, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.code !== 0) {
      writer.uint32(8).int32(message.code);
    }
    if (message.message !== "") {
      writer.uint32(18).string(message.message);
    }
    if (message.subscriptionId !== "") {
      writer.uint32(26).string(message.subscriptionId);
    }
    for (const v of message.shapeRequestError) {
      SatSubsDataError_ShapeReqError.encode(v!, writer.uint32(34).fork()).ldelim();
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): SatSubsDataError {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseSatSubsDataError();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 8) {
            break;
          }

          message.code = reader.int32() as any;
          continue;
        case 2:
          if (tag !== 18) {
            break;
          }

          message.message = reader.string();
          continue;
        case 3:
          if (tag !== 26) {
            break;
          }

          message.subscriptionId = reader.string();
          continue;
        case 4:
          if (tag !== 34) {
            break;
          }

          message.shapeRequestError.push(SatSubsDataError_ShapeReqError.decode(reader, reader.uint32()));
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  create<I extends Exact<DeepPartial<SatSubsDataError>, I>>(base?: I): SatSubsDataError {
    return SatSubsDataError.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<SatSubsDataError>, I>>(object: I): SatSubsDataError {
    const message = createBaseSatSubsDataError();
    message.code = object.code ?? 0;
    message.message = object.message ?? "";
    message.subscriptionId = object.subscriptionId ?? "";
    message.shapeRequestError = object.shapeRequestError?.map((e) => SatSubsDataError_ShapeReqError.fromPartial(e)) ||
      [];
    return message;
  },
};

messageTypeRegistry.set(SatSubsDataError.$type, SatSubsDataError);

function createBaseSatSubsDataError_ShapeReqError(): SatSubsDataError_ShapeReqError {
  return { $type: "Electric.Satellite.SatSubsDataError.ShapeReqError", code: 0, message: "", requestId: "" };
}

export const SatSubsDataError_ShapeReqError = {
  $type: "Electric.Satellite.SatSubsDataError.ShapeReqError" as const,

  encode(message: SatSubsDataError_ShapeReqError, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.code !== 0) {
      writer.uint32(8).int32(message.code);
    }
    if (message.message !== "") {
      writer.uint32(18).string(message.message);
    }
    if (message.requestId !== "") {
      writer.uint32(26).string(message.requestId);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): SatSubsDataError_ShapeReqError {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseSatSubsDataError_ShapeReqError();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 8) {
            break;
          }

          message.code = reader.int32() as any;
          continue;
        case 2:
          if (tag !== 18) {
            break;
          }

          message.message = reader.string();
          continue;
        case 3:
          if (tag !== 26) {
            break;
          }

          message.requestId = reader.string();
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  create<I extends Exact<DeepPartial<SatSubsDataError_ShapeReqError>, I>>(base?: I): SatSubsDataError_ShapeReqError {
    return SatSubsDataError_ShapeReqError.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<SatSubsDataError_ShapeReqError>, I>>(
    object: I,
  ): SatSubsDataError_ShapeReqError {
    const message = createBaseSatSubsDataError_ShapeReqError();
    message.code = object.code ?? 0;
    message.message = object.message ?? "";
    message.requestId = object.requestId ?? "";
    return message;
  },
};

messageTypeRegistry.set(SatSubsDataError_ShapeReqError.$type, SatSubsDataError_ShapeReqError);

function createBaseSatSubsDataBegin(): SatSubsDataBegin {
  return { $type: "Electric.Satellite.SatSubsDataBegin", subscriptionId: "", lsn: new Uint8Array() };
}

export const SatSubsDataBegin = {
  $type: "Electric.Satellite.SatSubsDataBegin" as const,

  encode(message: SatSubsDataBegin, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.subscriptionId !== "") {
      writer.uint32(10).string(message.subscriptionId);
    }
    if (message.lsn.length !== 0) {
      writer.uint32(18).bytes(message.lsn);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): SatSubsDataBegin {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseSatSubsDataBegin();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.subscriptionId = reader.string();
          continue;
        case 2:
          if (tag !== 18) {
            break;
          }

          message.lsn = reader.bytes();
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  create<I extends Exact<DeepPartial<SatSubsDataBegin>, I>>(base?: I): SatSubsDataBegin {
    return SatSubsDataBegin.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<SatSubsDataBegin>, I>>(object: I): SatSubsDataBegin {
    const message = createBaseSatSubsDataBegin();
    message.subscriptionId = object.subscriptionId ?? "";
    message.lsn = object.lsn ?? new Uint8Array();
    return message;
  },
};

messageTypeRegistry.set(SatSubsDataBegin.$type, SatSubsDataBegin);

function createBaseSatSubsDataEnd(): SatSubsDataEnd {
  return { $type: "Electric.Satellite.SatSubsDataEnd" };
}

export const SatSubsDataEnd = {
  $type: "Electric.Satellite.SatSubsDataEnd" as const,

  encode(_: SatSubsDataEnd, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): SatSubsDataEnd {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseSatSubsDataEnd();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  create<I extends Exact<DeepPartial<SatSubsDataEnd>, I>>(base?: I): SatSubsDataEnd {
    return SatSubsDataEnd.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<SatSubsDataEnd>, I>>(_: I): SatSubsDataEnd {
    const message = createBaseSatSubsDataEnd();
    return message;
  },
};

messageTypeRegistry.set(SatSubsDataEnd.$type, SatSubsDataEnd);

function createBaseSatShapeDataBegin(): SatShapeDataBegin {
  return { $type: "Electric.Satellite.SatShapeDataBegin", requestId: "", uuid: "" };
}

export const SatShapeDataBegin = {
  $type: "Electric.Satellite.SatShapeDataBegin" as const,

  encode(message: SatShapeDataBegin, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.requestId !== "") {
      writer.uint32(10).string(message.requestId);
    }
    if (message.uuid !== "") {
      writer.uint32(18).string(message.uuid);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): SatShapeDataBegin {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseSatShapeDataBegin();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.requestId = reader.string();
          continue;
        case 2:
          if (tag !== 18) {
            break;
          }

          message.uuid = reader.string();
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  create<I extends Exact<DeepPartial<SatShapeDataBegin>, I>>(base?: I): SatShapeDataBegin {
    return SatShapeDataBegin.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<SatShapeDataBegin>, I>>(object: I): SatShapeDataBegin {
    const message = createBaseSatShapeDataBegin();
    message.requestId = object.requestId ?? "";
    message.uuid = object.uuid ?? "";
    return message;
  },
};

messageTypeRegistry.set(SatShapeDataBegin.$type, SatShapeDataBegin);

function createBaseSatShapeDataEnd(): SatShapeDataEnd {
  return { $type: "Electric.Satellite.SatShapeDataEnd" };
}

export const SatShapeDataEnd = {
  $type: "Electric.Satellite.SatShapeDataEnd" as const,

  encode(_: SatShapeDataEnd, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): SatShapeDataEnd {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseSatShapeDataEnd();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  create<I extends Exact<DeepPartial<SatShapeDataEnd>, I>>(base?: I): SatShapeDataEnd {
    return SatShapeDataEnd.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<SatShapeDataEnd>, I>>(_: I): SatShapeDataEnd {
    const message = createBaseSatShapeDataEnd();
    return message;
  },
};

messageTypeRegistry.set(SatShapeDataEnd.$type, SatShapeDataEnd);

/** Main RPC service that the Electric server fulfills */
export interface Root {
  authenticate(request: SatAuthReq): Promise<SatAuthResp>;
  startReplication(request: SatInStartReplicationReq): Promise<SatInStartReplicationResp>;
  stopReplication(request: SatInStopReplicationReq): Promise<SatInStopReplicationResp>;
  subscribe(request: SatSubsReq): Promise<SatSubsResp>;
  unsubscribe(request: SatUnsubsReq): Promise<SatUnsubsResp>;
}

export class RootClientImpl implements Root {
  private readonly rpc: Rpc;
  private readonly service: string;
  constructor(rpc: Rpc, opts?: { service?: string }) {
    this.service = opts?.service || "Electric.Satellite.Root";
    this.rpc = rpc;
    this.authenticate = this.authenticate.bind(this);
    this.startReplication = this.startReplication.bind(this);
    this.stopReplication = this.stopReplication.bind(this);
    this.subscribe = this.subscribe.bind(this);
    this.unsubscribe = this.unsubscribe.bind(this);
  }
  authenticate(request: SatAuthReq): Promise<SatAuthResp> {
    const data = SatAuthReq.encode(request).finish();
    const promise = this.rpc.request(this.service, "authenticate", data);
    return promise.then((data) => SatAuthResp.decode(_m0.Reader.create(data)));
  }

  startReplication(request: SatInStartReplicationReq): Promise<SatInStartReplicationResp> {
    const data = SatInStartReplicationReq.encode(request).finish();
    const promise = this.rpc.request(this.service, "startReplication", data);
    return promise.then((data) => SatInStartReplicationResp.decode(_m0.Reader.create(data)));
  }

  stopReplication(request: SatInStopReplicationReq): Promise<SatInStopReplicationResp> {
    const data = SatInStopReplicationReq.encode(request).finish();
    const promise = this.rpc.request(this.service, "stopReplication", data);
    return promise.then((data) => SatInStopReplicationResp.decode(_m0.Reader.create(data)));
  }

  subscribe(request: SatSubsReq): Promise<SatSubsResp> {
    const data = SatSubsReq.encode(request).finish();
    const promise = this.rpc.request(this.service, "subscribe", data);
    return promise.then((data) => SatSubsResp.decode(_m0.Reader.create(data)));
  }

  unsubscribe(request: SatUnsubsReq): Promise<SatUnsubsResp> {
    const data = SatUnsubsReq.encode(request).finish();
    const promise = this.rpc.request(this.service, "unsubscribe", data);
    return promise.then((data) => SatUnsubsResp.decode(_m0.Reader.create(data)));
  }
}

/** RPC calls that the server makes to the client */
export interface ClientRoot {
  startReplication(request: SatInStartReplicationReq): Promise<SatInStartReplicationResp>;
  stopReplication(request: SatInStopReplicationReq): Promise<SatInStopReplicationResp>;
}

export class ClientRootClientImpl implements ClientRoot {
  private readonly rpc: Rpc;
  private readonly service: string;
  constructor(rpc: Rpc, opts?: { service?: string }) {
    this.service = opts?.service || "Electric.Satellite.ClientRoot";
    this.rpc = rpc;
    this.startReplication = this.startReplication.bind(this);
    this.stopReplication = this.stopReplication.bind(this);
  }
  startReplication(request: SatInStartReplicationReq): Promise<SatInStartReplicationResp> {
    const data = SatInStartReplicationReq.encode(request).finish();
    const promise = this.rpc.request(this.service, "startReplication", data);
    return promise.then((data) => SatInStartReplicationResp.decode(_m0.Reader.create(data)));
  }

  stopReplication(request: SatInStopReplicationReq): Promise<SatInStopReplicationResp> {
    const data = SatInStopReplicationReq.encode(request).finish();
    const promise = this.rpc.request(this.service, "stopReplication", data);
    return promise.then((data) => SatInStopReplicationResp.decode(_m0.Reader.create(data)));
  }
}

interface Rpc {
  request(service: string, method: string, data: Uint8Array): Promise<Uint8Array>;
}

type Builtin = Date | Function | Uint8Array | string | number | boolean | undefined;

export type DeepPartial<T> = T extends Builtin ? T
  : T extends Long ? string | number | Long : T extends Array<infer U> ? Array<DeepPartial<U>>
  : T extends ReadonlyArray<infer U> ? ReadonlyArray<DeepPartial<U>>
  : T extends {} ? { [K in Exclude<keyof T, "$type">]?: DeepPartial<T[K]> }
  : Partial<T>;

type KeysOfUnion<T> = T extends T ? keyof T : never;
export type Exact<P, I extends P> = P extends Builtin ? P
  : P & { [K in keyof P]: Exact<P[K], I[K]> } & { [K in Exclude<keyof I, KeysOfUnion<P> | "$type">]: never };

if (_m0.util.Long !== Long) {
  _m0.util.Long = Long as any;
  _m0.configure();
}
