declare module "@uesio/bots" {
type BotParamValue = string | boolean | number | object | undefined

interface BotParamsApi<T> {
  get: (paramName: keyof T) => T[keyof T]
  getAll: () => T
}
interface FieldRequest {
  id: string
  fields?: FieldRequest[]
}
type Conjunction = "AND" | "OR"
type ConditionOperator =
  | "EQ"
  | "NOT_EQ"
  | "GT"
  | "LT"
  | "GTE"
  | "LTE"
  | "IN"
  | "NOT_IN"
  | "IS_BLANK"
  | "IS_NOT_BLANK"
type FieldValue = string | number | boolean | object | null | undefined
type ConditionType = "SEARCH" | "GROUP" | "SUBQUERY"
interface ConditionRequest {
  id?: string
  field: string
  operator: ConditionOperator
  value?: FieldValue
  values?: FieldValue[]
  type?: ConditionType
  conjunction?: Conjunction
  fields?: string[]
  conditions?: ConditionRequest[]
  subcollection?: string
  subfield?: string
  inactive?: boolean
}
interface LoadOrder {
  field: string
  desc: boolean
}
interface WireRecord {
  GetField: (field: string) => FieldValue | undefined
  SetField: (field: string, value: FieldValue) => void
}
interface LoadRequest {
  batchsize?: number
  collection: string
  fields?: FieldRequest[]
  conditions?: ConditionRequest[]
  order?: LoadOrder[]
  loadAll?: boolean
}
type Logger = (message: string, ...data: unknown[]) => void

interface LogApi {
  info: Logger
  warn: Logger
  error: Logger
}

interface BaseChangeApi {
  addError: (error: string) => void
  getId: () => string
}

interface InsertApi extends BaseChangeApi {
  get: (field: string) => FieldValue
  getAll: () => Record<string, FieldValue>
  set: (field: string, value: FieldValue) => void
  setAll: (fields: Record<string, FieldValue>) => void
}
interface ChangeApi extends InsertApi {
  getOld: (field: string) => FieldValue
}
interface DeleteApi extends BaseChangeApi {
  getOld: (field: string) => FieldValue
}
interface InsertsApi {
  get: () => InsertApi[]
}
interface UpdatesApi {
  get: () => ChangeApi[]
}
interface DeletesApi {
  get: () => DeleteApi[]
}
interface SessionApi {
  getId: () => string
  // Returns true only if the Bot is being run in a Workspace context
  inWorkspaceContext: () => boolean
  // If in a Workspace context, returns a Workspace Api
  // to obtain info about the context Workspace
  getWorkspace: () => WorkspaceApi
  // returns a Site Api
  // to obtain info about the context Workspace
  getSite: () => SiteApi
}
interface SiteApi {
  // Return the name of the site
  getName: () => string
  // Return the title of the site
  getTitle: () => string
  // Return the domain of the site
  getDomain: () => string
  // Return the subdomain of the site
  getSubDomain: () => string
}
interface WorkspaceApi {
  // Return the name of the workspace
  getName: () => string
  // Return the fully-qualified name of the workspace's app
  getAppFullName: () => string
  // Return the URL prefix to use for routes in the workspace
  getUrlPrefix: () => string
}
interface UserApi {
  getId: () => string
  getUsername: () => string
  getEmail: () => string
  getUniqueKey: () => string
}

interface BotHttpRequest<
  RequestBody = string | Record<string, unknown> | unknown[],
> {
  url: string
  method: string
  headers?: Record<string, string>
  body?: RequestBody
}
interface BotHttpResponse<
  ResponseBody = string | Record<string, unknown> | null,
> {
  code: number
  status: string
  headers: Record<string, string>
  body: ResponseBody
}

interface HttpApi {
  request: <RequestBody, ResponseBody>(
    options: BotHttpRequest<RequestBody>,
  ) => BotHttpResponse<ResponseBody>
}

interface IntegrationApi {
  getBaseURL(): string | undefined
}

type RunIntegrationAction = (
  integration: string,
  action: string,
  options: unknown,
) => unknown

type CallBot = (
  botName: string,
  params: Record<string, FieldValue>,
) => Record<string, FieldValue>

interface BeforeSaveBotApi {
  addError: (error: string) => void
  load: (loadRequest: LoadRequest) => Record<string, FieldValue>[]
  save: (
    collectionName: string,
    records: WireRecord[],
    options?: {
      upsert?: boolean
    },
  ) => Record<string, FieldValue>[]
  delete: (collectionName: string, records: WireRecord[]) => void
  deletes: DeletesApi
  inserts: InsertsApi
  updates: UpdatesApi
  callBot: CallBot
  runIntegrationAction: RunIntegrationAction
  getConfigValue: (configValueKey: string) => string
  log: LogApi
}
interface AfterSaveBotApi extends BeforeSaveBotApi {
  asAdmin: AsAdminApi
}
interface AsAdminApi {
  load: (loadRequest: LoadRequest) => Record<string, FieldValue>[]
  delete: (collectionName: string, records: WireRecord[]) => void
  save: (
    collectionName: string,
    records: WireRecord[],
    options?: {
      upsert?: boolean
    },
  ) => Record<string, FieldValue>[]
  runIntegrationAction: RunIntegrationAction
  callBot: CallBot
  getConfigValue: (configValueKey: string) => string
}
interface ListenerBotApi<T = Record<string, BotParamValue>> {
  addResult: (key: string, value: FieldValue | undefined) => void
  load: (loadRequest: LoadRequest) => Record<string, FieldValue>[]
  params: BotParamsApi<T>
  delete: (collectionName: string, records: WireRecord[]) => void
  save: (
    collectionName: string,
    records: WireRecord[],
    options?: {
      upsert?: boolean
    },
  ) => Record<string, FieldValue>[]
  runIntegrationAction: RunIntegrationAction
  callBot: CallBot
  getConfigValue: (configValueKey: string) => string
  asAdmin: AsAdminApi
  getCollectionMetadata: getCollectionMetadata
  getSession: () => SessionApi
  getUser: () => UserApi
  // Returns the fully-qualified namespace of the Bot, e.g. "acme/recruiting"
  getNamespace: () => string
  // Returns the name of the Bot, e.g "add_numbers"
  getName: () => string
  copyFile: (
    sourceFileKey: string,
    sourcePath: string,
    destCollection: string,
    destRecord: string,
    destField: string,
  ) => void
  copyUserFile: (
    sourceFileId: string,
    destCollection: string,
    destRecord: string,
    destField: string,
  ) => void
  getFileUrl: (fileKey: string, filePath: string) => string
  getFileContents: (fileKey: string, filePath: string) => string
  mergeTemplate: (
    template: string,
    params: Record<string, FieldValue>,
  ) => string
  mergeTemplateFile: (
    fileKey: string,
    filePath: string,
    params: Record<string, FieldValue>,
  ) => string
  log: LogApi
  http: HttpApi
}
interface RunActionBotApi {
  addError: (error: string) => void
  addResult: (key: string, value: FieldValue | undefined) => void
  getActionName: () => string
  getCredentials: () => Record<string, string | undefined>
  getConfigValue: (configValueKey: string) => string
  getIntegration: () => IntegrationApi
  getSession: () => SessionApi
  getUser: () => UserApi
  http: HttpApi
  load: (loadRequest: LoadRequest) => Record<string, FieldValue>[]
  log: LogApi
  params: BotParamsApi
  save: (
    collectionName: string,
    records: WireRecord[],
    options?: {
      upsert?: boolean
    },
  ) => Record<string, FieldValue>[]
  callBot: CallBot
}

type FieldType =
  | "AUTONUMBER"
  | "CHECKBOX"
  | "DATE"
  | "EMAIL"
  | "FILE"
  | "LIST"
  | "LONGTEXT"
  | "MAP"
  | "METADATA"
  | "MULTIMETADATA"
  | "MULTISELECT"
  | "NUMBER"
  | "REFERENCE"
  | "REFERENCEGROUP"
  | "SELECT"
  | "STRUCT"
  | "TEXT"
  | "TIMESTAMP"
  | "USER"
  | "ANY"

interface ReferenceMetadata {
  /**
   * Returns the fully-qualified collection name for this Reference field,
   * if it is a single-collection Reference field.
   */
  getCollection: () => string | undefined
  /**
   * Returns a list of fully-qualified collection names for this Reference field,
   * if it is a multi-collection Reference field and there are specific allowed
   * collections defined. If this is an unbounded multi-collection Reference field,
   * no collections will be returned.
   */
  getCollections: () => string[] | undefined
  /**
   * Returns true if this is a multi-collection Reference field, otherwise false.
   */
  isMultiCollection: () => boolean
}

interface FieldMetadata {
  accessible: boolean
  createable: boolean
  externalName?: string
  label: string
  name: string
  namespace: string
  type: FieldType
  updateable: boolean
  /**
   * If this field is mapped to an external integration field,
   * this returns the external field name.
   */
  getExternalFieldName: () => string | undefined
  /**
   * If this is a Reference field, returns a ReferenceMetadata API
   */
  getReferenceMetadata: () => ReferenceMetadata | undefined
}

interface CollectionMetadata {
  /** Returns true if the current user has permission to access records of this collection. */
  accessible: boolean
  /**
   * Returns the external field defined for the provided fully-qualified field id, if it exists.
   */
  getFieldIdByExternalName: (externalName: string) => string | undefined
  /**
   * Returns a FieldMetadata API corresponding to the provided external field name, if a Uesio field
   * exists with that external field name mapped to it.
   */
  getFieldMetadataByExternalName: (externalName: string) => string | undefined
  /**
   * Returns the Uesio field id corresponding to the provided external field name.
   */
  getExternalFieldName: (uesioFieldId: string) => string | undefined
  /**
   * Returns a FieldMetadata API for the provided fully-qualified field id.
   */
  getFieldMetadata: (fieldId: string) => FieldMetadata
  /**
   * Returns a map containing, for all fields defined on this collection, a mapping from that field's id
   * to a corresponding FieldMetadata API.
   */
  getAllFieldMetadata: () => Record<string, FieldMetadata>
  /** Returns true if the current user has permission to delete records of this collection. */
  deleteable: boolean
  /** Returns true if the current user has permission to create new records of this collection. */
  createable: boolean
  /** Returns the external collection name for this collection, if defined (Only relevant for external integration collections) **/
  externalName?: string
  label: string
  labelPlural: string
  name: string
  namespace: string
  /** Returns true if the current user has permission to update existing records of this collection. */
  updateable: boolean
}

interface LoadRequestMetadata {
  /** Returns the current batch number which the user is requesting to load. Defaults to 0. */
  batchNumber?: number
  /** For paginated requests, the number of records requested to load in this request */
  batchSize?: number
  /** The fully-qualified Uesio collection name which the user is requesting to load, e.g. "acme/recruiting.job" */
  collection: string
  /** A CollectionMetadata API object for the main collection which the user is requesting to load. */
  collectionMetadata: CollectionMetadata
  /** Conditions for the load request being made. Your Load Bot should process these conditions and filter your data set
   * accordingly based on the Condition's type.
   */
  conditions?: ConditionRequest[]
  /** The fields which the user is requesting to load in this request. Your Load Bot should only return values for these fields
   * on records which match the request's conditions.
   */
  fields?: FieldRequest[]
  /** An array of objects describing the fields and sort direction to use when sorting records to be returned.
   *  The first entry in the array should be used to sort first, then, for records with identical sort values,
   *  the second entry should be used, etc.
   */
  order?: LoadOrder[]
}

interface SaveRequestMetadata {
  collection: string
  collectionMetadata: CollectionMetadata
  upsert: boolean
}

type getCollectionMetadata = (collectionKey: string) => CollectionMetadata

interface LoadBotApi {
  addError: (error: string) => void
  addRecord: (record: Record<string, unknown>) => void
  loadRequest: LoadRequestMetadata
  /**
   * Returns metadata for a collection which has been referenced as part of the load operation.
   * This collection's metadata must have already been fetched as part of the load operation,
   * otherwise no metadata will be returned.
   * @param collectionKey The fully-qualified collection key, e.g. "luigi/foo"
   */
  getCollectionMetadata: getCollectionMetadata
  /**
   * Returns metadata about the collection's associated integration.
   */
  getIntegration: () => IntegrationApi
  /**
   * Returns a dictionary of config values/secrets/etc from the collection's integration's credentials,
   * if defined.
   */
  getCredentials: () => Record<string, string | undefined>
  /**
   * Returns the resolved value for any config value available in this app.
   * @param configValueKey The fully-qualified config value id, e.g. "uesio/salesforce.base_url"
   */
  getConfigValue: (configValueKey: string) => string
  getSession: () => SessionApi

  getUser: () => UserApi
  /**
   * Should be called to inform Uesio that the integration has additional pages / batches of data
   * which could be returned in subsequent calls, if the user desires additional records.
   * If this is not called, Uesio will assume that all records have been returned.
   */
  setHasMoreRecords: () => void
  log: LogApi
  http: HttpApi
  /**
   * Calls another Bot (must be a Listener Bot).
   * @param botName The fully-qualified bot name, e.g. "luigi/foo.add_numbers"
   * @param params A map of input parameters for the bot.
   * @returns A map of output parameters from the bot.
   */
  callBot: CallBot
  load: (loadRequest: LoadRequest) => Record<string, FieldValue>[]
}
interface SaveBotApi {
  addError: (message: string, fieldId: string, recordId: string) => void
  deletes: DeletesApi
  inserts: InsertsApi
  updates: UpdatesApi
  saveRequest: SaveRequestMetadata
  /**
   * Returns metadata for a collection which has been referenced as part of the save operation.
   * This collection's metadata must have already been fetched as part of the save operation,
   * otherwise no metadata will be returned.
   * @param collectionKey The fully-qualified collection key, e.g. "luigi/foo"
   */
  getCollectionMetadata: (collectionKey: string) => CollectionMetadata
  getIntegration: () => IntegrationApi
  getCredentials: () => Record<string, string | undefined>
  getConfigValue: (configValueKey: string) => string
  getSession: () => SessionApi
  getUser: () => UserApi
  log: LogApi
  http: HttpApi
  callBot: CallBot
  load: (loadRequest: LoadRequest) => Record<string, FieldValue>[]
}

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE"

interface ReadableStringMap {
  get: (key: string) => string | undefined
  has: (key: string) => boolean
}

interface HttpRequestApi {
  // The path portion of the current request URL
  path: string
  // Return a composite of any path/query string parameters for the current request
  params: BotParamsApi
  // Return the request method for the current request, e.g. GET/POST
  method: HttpMethod
  // Return the request headers for the current request
  headers: ReadableStringMap
  // Return the request body for the current request, if any
  body: unknown
}

type Enumerate<
  N extends number,
  Acc extends number[] = [],
> = Acc["length"] extends N
  ? Acc[number]
  : Enumerate<N, [...Acc, Acc["length"]]>

type IntRange<F extends number, T extends number> = Exclude<
  Enumerate<T>,
  Enumerate<F>
>

type StatusCode = IntRange<200, 500>

interface RouteResponseApi {
  // Initiates a redirect to the provided URL, using response code 301 by default
  redirectToURL: (
    // the absolute/relative URL to redirect to
    url: string,
  ) => void
  // Set the response status code to return to the client.
  // If this is NOT called, the default status code will be 200.
  setStatusCode: (statusCode: StatusCode) => void
  // Sets the response body to return to the client,
  // and optionally sets the content type of the response
  // (sets the Content-Type header as well)
  setBody: (data: unknown, contentType?: string) => void
  // Sets a single response header
  setHeader: (headerName: string, headerValue: string) => void
  // Sets multiple response headers at a time
  setHeaders: (headers: Record<string, string>) => void
}

interface RouteBotApi {
  // Return an API into all Params for the current request,
  // containing both the route path params and query string params
  params: BotParamsApi
  // Get information about the current Bot request
  request: HttpRequestApi
  // Determine what response is sent to the client
  response: RouteResponseApi

  // Fetch data from a collection
  load: (loadRequest: LoadRequest) => Record<string, FieldValue>[]
  // Delete records from a collection
  delete: (collectionName: string, records: WireRecord[]) => void
  // Insert/update collection records
  save: (
    collectionName: string,
    records: WireRecord[],
    options?: {
      upsert?: boolean
    },
  ) => Record<string, FieldValue>[]
  // Run a specific integration action
  runIntegrationAction: RunIntegrationAction
  // Go into "admin" mode, elevating the session to have unrestricted admin access
  // to perform collection operations that the current session is not authorized to do.
  asAdmin: AsAdminApi
  // Returns the fully-qualified namespace of the Bot, e.g. "acme/recruiting"
  getNamespace: () => string
  // Returns the name of the Bot, e.g "add_numbers"
  getName: () => string

  /**
   * Returns the resolved value for any config value available in this app.
   * @param configValueKey The fully-qualified config value id, e.g. "uesio/salesforce.base_url"
   */
  getConfigValue: (configValueKey: string) => string
  getSession: () => SessionApi
  getUser: () => UserApi
  log: LogApi
  http: HttpApi
  /**
   * Call a Listener Bot
   * @param botName The fully-qualified bot name, e.g. "luigi/foo.add_numbers"
   * @param params A map of input parameters for the bot.
   * @returns A map of output parameters from the bot.
   */
  callBot: CallBot
}

type PlainWireRecord = {
  [key: string]: FieldValue
}

type SaveError = {
  recordid?: string
  fieldid?: string
  message: string
}

type SaveResponse = {
  wire: string
  errors: null | SaveError[]
  changes: ChangeResults
  deletes: ChangeResults
}

type ChangeResults = Record<string, PlainWireRecord>

type SaveResponseBatch = {
  wires: SaveResponse[]
}

export type {
  AfterSaveBotApi,
  BeforeSaveBotApi,
  BotHttpResponse,
  BotParamsApi,
  ChangeApi,
  ConditionOperator,
  ConditionRequest,
  ConditionType,
  DeleteApi,
  FieldRequest,
  FieldValue,
  HttpMethod,
  HttpRequestApi,
  RouteResponseApi,
  InsertApi,
  ListenerBotApi,
  LoadBotApi,
  LoadOrder,
  LoadRequest,
  LoadRequestMetadata,
  PlainWireRecord,
  ReadableStringMap,
  RouteBotApi,
  RunActionBotApi,
  SaveBotApi,
  SaveResponseBatch,
  SessionApi,
  StatusCode,
  WorkspaceApi,
  WireRecord,
}
}
declare module "@uesio/ui" {
import { FC, ReactNode } from "react"
import { Class, cx } from "@twind/core"

type FieldMode = "READ" | "EDIT"

type SiteState = {
  name: string
  app: string
  domain: string
  subdomain: string
  version: string
  title?: string
}

type RouteState = {
  view: string
  params?: Record<string, string>
  namespace: string
  path: string
  theme: string
  title: string
  isLoading?: boolean
} | null

type UserState = {
  id: string
  username: string
  site: string
  firstname: string
  lastname: string
  profile: string
  picture: UserPictureState | null
} | null

type UserPictureState = {
  id: string
  updatedat: number
}

interface Palette {
  primary: string
  secondary: string
  error: string
  warning: string
  info: string
  success: string
  // Allow any key as well, but require a minimum of the above
  [key: string]: string
}

type ThemeState = {
  name: string
  namespace: string
  definition: {
    spacing: number
    palette: Palette
  }
}

type Context = {
  /**
   * Adds a Component-specific context frame to the current stack
   * @param componentType - the fully-qualified component type, e.g. uesio/io.barchart
   * @param data - arbitrary data to be associated with this component context frame
   * @returns new Context object
   */
  addComponentFrame: (
    componentType: string,
    data: Record<string, unknown>,
  ) => Context
  /**
   * Adds a Signal-specific context frame to the current stack
   * @param label - the frame label or stepId
   * @param data - arbitrary data to be associated with this signal output context frame
   * @returns new Context object
   */
  addSignalOutputFrame: (label: string, data: unknown) => Context
  /**
   * Merges a text string containing merges, e.g. ${uesio/core.uniquekey} in the current context
   * @param text - the text to be merged
   * @returns the merged text
   */
  merge: (text: string) => string
  /**
   * Returns an array of errors that are part of the current context
   * @returns Array of error strings
   */
  getCurrentErrors: () => string[]
  /**
   * Returns the mode of the closest context FIELD_MODE frame, or "READ" if no such frame is in context.
   * @returns FieldMode
   */
  getFieldMode: () => FieldMode
  /**
   * Returns the translated value of a given label by its API name
   * @param String - the label's API name, e.g. "create_new"
   * @returns translated label
   */
  getLabel: (labelName: string) => UserState
  /**
   * Returns the value of a given View parameter, if present
   * @param String - the parameter name
   * @returns parameter value
   */
  getParam: (paramName: string) => string
  /**
   * Returns a map of all provided View parameters
   * @returns all parameter values
   */
  getParams: () => Record<string, string>
  /**
   * Returns either the closest context Record from a RecordFrame or a RecordDataFrame
   * or the closest context Record in the specified Wire.
   * @returns WireRecord object
   */
  getRecord: (wireId?: string) => WireRecord
  /**
   * Returns the id of the closest context Record
   * @returns string
   */
  getRecordId: () => string
  /**
   * Returns the state of the context Route
   * @returns RouteState object
   */
  getRoute: () => RouteState
  /**
   * Returns signal output for a paricular label
   * @returns Data object
   */
  getSignalOutputData: (label: string) => object
  /**
   * Returns info about the current Site
   * @returns Wire object
   */
  getSite: () => SiteState
  /**
   * Returns the context Theme definition
   * @returns ThemeState
   */
  getTheme: () => ThemeState
  /**
   * Returns the API name of the context Theme
   * @returns string
   */
  getThemeId: () => string
  /**
   * Returns the logged-in user
   * @returns UserState object
   */
  getUser: () => UserState
  /**
   * Returns either the closest context Wire, or the Wire with the given ID
   * @returns Wire object
   */
  getWire: (wireId?: string) => Wire
  /**
   * Returns whether or not errors exist in the current context
   * @returns true or false
   */
  hasErrors: () => boolean
}

type ComponentSignalDescriptor = {
  dispatcher: (state: unknown, signal: object, context: Context) => void
}
export type UC<T = DefinitionMap> = FC<BaseProps<T>> & {
  signals?: Record<string, ComponentSignalDescriptor>
}
export type UtilityComponent<T = DefinitionMap> = FC<T & UtilityProps>
export interface UtilityProps {
  id?: string
  variant?: MetadataKey
  styleTokens?: Record<string, string[]>
  classes?: Record<string, string>
  className?: string
  context: Context
  children?: ReactNode
}
export type DefinitionMap = Record<string, unknown>
export type DefinitionList = DefinitionMap[]
export type DefinitionValue = unknown
export type Definition =
  | DefinitionValue
  | DefinitionMap
  | DefinitionValue[]
  | DefinitionMap[]
export type BaseDefinition = {
  "uesio.id"?: string
  "uesio.styleTokens"?: Record<string, string[]>
  "uesio.variant"?: MetadataKey
  "uesio.classes"?: string
}
export type BaseProps<T = DefinitionMap> = {
  definition: T & BaseDefinition
  path: string
  componentType?: MetadataKey
  context: Context
  children?: ReactNode
}

export type METADATA = {
  AUTHSOURCE: "authsources"
  BOT: "bots"
  COLLECTION: "collections"
  COMPONENT: "components"
  COMPONENTPACK: "componentpacks"
  COMPONENTVARIANT: "componentvariants"
  CONFIGVALUE: "configvalues"
  CREDENTIALS: "credentials"
  FIELD: "fields"
  FILE: "files"
  FILESOURCE: "filesources"
  INTEGRATION: "integrations"
  INTEGRATIONACTION: "integrationactions"
  INTEGRATIONTYPE: "integrationtypes"
  LABEL: "labels"
  PERMISSIONSET: "permissionsets"
  PROFILE: "profiles"
  RECORDCHALLENGETOKEN: "recordchallengetokens"
  ROUTE: "routes"
  SECRET: "secrets"
  SELECTLIST: "selectlists"
  SIGNUPMETHOD: "signupmethods"
  THEME: "themes"
  USERACCESSTOKEN: "useraccesstokens"
  VIEW: "views"
}
export type MetadataType = keyof METADATA
type MetadataKey = `${string}/${string}.${string}`

//
// STYLES
//

declare function useUtilityStyleTokens(
  defaults: Record<string, Class[]>,
  props: UtilityProps,
  defaultVariantComponentType?: MetadataKey,
): Record<string, string>
declare function useStyleTokens(
  defaults: Record<string, Class[]>,
  props: BaseProps,
): Record<string, string>

export const styles = {
  useUtilityStyleTokens,
  useStyleTokens,
  cx,
}

//
// COMPONENT
//

interface SlotUtilityProps extends UtilityProps {
  path: string
  definition?: DefinitionMap
  listName?: string
  // componentType will be populated if we're coming from a Declarative Component,
  // where we need to be able to lookup the Slot metadata.
  componentType?: MetadataKey
}

interface UtilityPropsPlus extends UtilityProps {
  [x: string]: unknown
}

export namespace component {
  export namespace registry {
    export function register(key: MetadataKey, componentType: UC): void
    export function registerUtilityComponent(
      key: MetadataKey,
      componentType: FC<UtilityProps>,
    ): void
  }
  export function Component(...args: Parameters<UC>): ReturnType<UC>
  export function Slot(
    ...args: Parameters<FC<SlotUtilityProps>>
  ): ReturnType<FC>
  export function getUtility<T extends UtilityProps = UtilityPropsPlus>(
    key: MetadataKey,
  ): UtilityComponent<T>
}

//
// DEFINITION
//
export namespace definition {
  export type BaseProps<T = DefinitionMap> = {
    definition: T & BaseDefinition
    path: string
    componentType?: MetadataKey
    context: Context
    children?: ReactNode
  }

  export type UC<T = DefinitionMap> = FC<BaseProps<T>> & {
    signals?: Record<string, ComponentSignalDescriptor>
  }
  export type UtilityComponent<T = DefinitionMap> = FC<T & UtilityProps>
  interface UtilityProps {
    id?: string
    variant?: MetadataKey
    styleTokens?: Record<string, string[]>
    classes?: Record<string, string>
    className?: string
    context: Context
    children?: ReactNode
  }
  export type DefinitionMap = Record<string, unknown>
  export type DefinitionList = DefinitionMap[]
  export type DefinitionValue = unknown
  export type Definition =
    | DefinitionValue
    | DefinitionMap
    | DefinitionValue[]
    | DefinitionMap[]
  export type BaseDefinition = {
    "uesio.id"?: string
    "uesio.styleTokens"?: Record<string, string[]>
    "uesio.variant"?: MetadataKey
    "uesio.classes"?: string
  }
}

type PARAM = "PARAM"
type LOOKUP = "LOOKUP"
type VALUE = "VALUE"
type SEARCH = "SEARCH"
type GROUP = "GROUP"
type Conjunction = "AND" | "OR"
type ConditionOperators =
  | "EQ"
  | "NOT_EQ"
  | "GT"
  | "LT"
  | "GTE"
  | "LTE"
  | "IN"
  | "NOT_IN"
  | "IS_BLANK"
  | "IS_NOT_BLANK"
type WireCondition =
  | ParamCondition
  | LookupCondition
  | ValueCondition
  | SearchCondition
  | GroupCondition
type ConditionBase = {
  id?: string
  operator?: ConditionOperators
  inactive?: boolean
}
type GroupCondition = ConditionBase & {
  type: GROUP
  conjunction: Conjunction
  conditions: ConditionBase[]
  valueSource: undefined
}
type SearchCondition = ConditionBase & {
  type: SEARCH
  value: string
  valueSource?: undefined
  fields?: string[]
}
type ParamCondition = ConditionBase & {
  type?: undefined
  field: string
  valueSource: PARAM
  param: string
}
type LookupCondition = ConditionBase & {
  type?: undefined
  field: string
  valueSource: LOOKUP
  lookupWire: string
  lookupField: string
}
type ValueCondition = ConditionBase & {
  type?: undefined
  field: string
  valueSource: VALUE | undefined
  value: PlainFieldValue
  start?: PlainFieldValue
  end?: PlainFieldValue
  inclusiveStart?: boolean
  inclusiveEnd?: boolean
}

type FieldType =
  | "AUTONUMBER"
  | "CHECKBOX"
  | "DATE"
  | "EMAIL"
  | "FILE"
  | "LIST"
  | "LONGTEXT"
  | "MAP"
  | "METADATA"
  | "MULTIMETADATA"
  | "MULTISELECT"
  | "NUMBER"
  | "REFERENCE"
  | "REFERENCEGROUP"
  | "SELECT"
  | "STRUCT"
  | "TEXT"
  | "TIMESTAMP"
  | "USER"
  | "ANY"

type AcceptTypes = "IMAGE" | "AUDIO" | "VIDEO" | "DOCUMENT" | "ANY"

type SelectOption = {
  label: string
  value: string
  languageLabel?: string
  disabled?: boolean
  title?: string
}

type NumberMetadata = {
  decimals: number
}

type SelectListMetadata = {
  name: string
  options: SelectOption[]
  blank_option_label?: string
  blank_option_language_label?: string
}

type FileMetadata = {
  accept: AcceptTypes
  filesource: string
}

type ReferenceMetadata = {
  collection: string
}

type ReferenceGroupMetadata = {
  collection: string
  field: string
}

type GetSelectOptionsProps = {
  context: Context
  // A blank option is added by default, but can be disabled by setting this to false
  addBlankOption?: boolean
}

/**
 * API for interacting with the Fields on a Collection
 */
type Field = {
  /**
   * Get the fully-qualified field name, e.g. "uesio/core.firstname"
   */
  getId: () => string
  /**
   * Returns just the field's name, e.g. "firstname"
   */
  getName: () => string
  /**
   * Returns the namespace of the field's app, e.g. "uesio/core"
   */
  getNamespace: () => string
  /**
   * Get the label defined for the field, e.g. "First Name"
   */
  getLabel: () => string
  /**
   * Returns the Uesio field type
   */
  getType: () => FieldType
  /**
   * Returns true if the field is createable by the current user
   */
  getCreateable: () => boolean
  /**
   * Returns true if the field is updateable by the current user
   */
  getUpdateable: () => boolean
  /**
   * Returns true if the field is accessible by the current user
   */
  getAccessible: () => boolean
  /**
   * If this is a "Reference" field, returns the Reference field specific metadata extensions
   */
  getReferenceMetadata: () => ReferenceMetadata
  /**
   * If this is a "Select" field, returns the Select field specific metadata extensions
   */
  getSelectMetadata: (context: Context) => SelectListMetadata
  /**
   * If this is a "Select" field, returns a list of the options defined for the field.
   * By default, this list will include a blank option, using the Select List's defined Blank Option Label,
   * but this can be disabled by setting the addBlankOption parameter to false.
   */
  getSelectOptions: (props: GetSelectOptionsProps) => SelectOption[]
  /**
   * If this is a "Number" field, returns the Number field specific metadata extensions
   */
  getNumberMetadata: () => NumberMetadata
  /**
   * Returns true if this is a "Reference" type field, or one of the special Reference-extending types
   */
  isReference: () => boolean
  /**
   * Returns true if this is a required field
   */
  isRequired: () => boolean
}

type Collection = {
  /**
   * Get the collection's app-unique name, e.g. "user", "contact"
   */
  getId: () => string
  /**
   * Get the collection's associated app, e.g. "uesio/core"
   */
  getNamespace: () => string
  /**
   * Get the fully-qualified collection name, e.g. "uesio/core.user"
   */
  getFullName: () => string
  /**
   * Get the collection's label, e.g. "User", "Contact"
   */
  getLabel: () => string
  /**
   * Get the collection's plural label, e.g. "Users", "Contacts"
   */
  getPluralLabel: () => string
  /**
   * Get the metadata for a field on the collection, using the fully-qualified field name.
   * To fetch a sub-field on an associated Reference field, use a path separator ("->"),
   * for example "uesio/core.owner->uesio/core.username"
   * @param fieldName string - the field's API name, e.g. "user/app.fieldName", or "uesio/core.user->uesio/core.username"
   */
  getField: (fieldName: string) => Field | undefined
  /**
   * Get the metadata for the collection's id field
   */
  getIdField: () => Field
  /**
   * Get the metadata for the collection's name field (if a name field is defined on the collection)
   */
  getNameField: () => Field | undefined
}
type WireField = {
  id: string
  fields?: WireField[]
}

interface CreateRecordsOptions {
  context: Context
  records: PlainWireRecord[]
  prepend?: boolean
}

type Wire = {
  cancel: () => void
  createRecord: (
    record: PlainWireRecord,
    prepend?: boolean,
    recordId?: string,
  ) => WireRecord
  createRecords: (CreateRecordsOptions) => Context
  empty: () => void
  getChanges: () => WireRecord[]
  getCollection: () => Collection
  getCondition: (conditionId: string) => WireCondition | null
  getConditions: () => WireCondition[]
  getData: () => WireRecord[]
  getDeletes: () => WireRecord[]
  getErrors: () => Record<string, string[]>
  getFields: () => Record<string, WireField>
  getFirstRecord: () => WireRecord
  getFullId: () => string
  getId: () => string
  getPlainData: () => PlainWireRecord[]
  getRecord: (recordId: string) => WireRecord
  getSize: () => number
  getViewId: () => string
  hasAllRecords: () => boolean
  hasMore: () => boolean
  isLoading: () => boolean
  isMarkedForDeletion: () => boolean
  isViewOnly: () => boolean
  load: (context: Context) => void
  markRecordForDeletion: (recordId: string) => void
  save: (context: Context) => void
  setConditionValue: (conditionId: string, value: FieldValue) => void
  toggleCondition: (conditionId: string) => void
  unmarkRecordForDeletion: (recordId: string) => void
}
type FieldValue =
  | PlainFieldValue
  | PlainWireRecord
  | PlainFieldValue[]
  | PlainWireRecord[]
type PlainWireRecord = {
  [key: string]: FieldValue
}
type PlainFieldValue = string | number | boolean | undefined | null
type WireRecord = {
  /**
   * Returns the stable, unique id of this record, which is created when the record is first saved.
   */
  getIdFieldValue: () => string
  /**
   * Get the value of a field on the record.
   * @param fieldName - string - the fully-qualified field name, e.g. "uesio/core.firstname", which may contain path separators to access fields across Reference field boundaries, e.g. "uesio/core.owner->uesio/core.username"
   */
  getFieldValue: <T extends FieldValue>(fieldName: string) => T | undefined
  /**
   * Returns an object representation of the raw data fields for the record, which can be useful when interacting with other frameworks or component libraries
   */
  getPlainData: () => PlainWireRecord
  /**
   * Returns the unique key value for this record, as specified by the collection's unique key fields
   */
  getUniqueKey: () => string
  /**
   * Returns the parent Wire for this record
   */
  getWire: () => Wire
  /**
   * Returns true if this record is marked for deletion
   */
  isDeleted: () => boolean
  /**
   * Returns true if this is a newly-created record which has not yet been saved to the database
   */
  isNew: () => boolean
  /**
   * Update the value of the specified field on this record
   * @param fieldId string - the fully-qualified field name, e.g. "uesio/core.firstname"
   * @param value FieldValue - the new value to use for this field
   * @param context Context - the context in which to perform the update
   */
  update: (fieldId: string, value: FieldValue, context: Context) => void
  /**
   * Remove a record from the wire
   */
  remove: () => void
}

type OrderState = {
  field: MetadataKey
  desc: boolean
}

type PlainWire = {
  batchid: string
  batchnumber: number
  changes: Record<string, PlainWireRecord>
  collection: string
  data: Record<string, PlainWireRecord>
  deletes: Record<string, PlainWireRecord>
  name: string
  original: Record<string, PlainWireRecord>
  query?: boolean
  create?: boolean
  view: string
  batchsize?: number
  viewOnly: boolean
  loadAll?: boolean
}

interface SignalDefinition {
  signal: string
  stepId?: string
  [key: string]: Definition
}

// SIGNAL
export namespace signal {
  export { SignalDefinition }
}

// API
export namespace api {
  export namespace signal {
    /**
     * Returns a handler function for running a list of signals
     * @param signals Array of Signals to run
     * @param context Context object
     * @returns handler function
     */
    export function getHandler(
      signals: SignalDefinition[] | undefined,
      context: Context,
    ): () => Context

    /**
     * Runs a single signal
     * @param signal Signal to run
     * @param context Context object
     * @returns a promise with a new Context that could have been altered by the signal
     */
    export function run(
      signal: SignalDefinition,
      context: Context,
    ): Promise<Context>

    /**
     * Runs a set of signals
     * @param signals Array of Signals to run
     * @param context Context object
     * @returns a promise with a new Context that could have been altered by the signal
     */
    export function runMany(
      signals: SignalDefinition[],
      context: Context,
    ): Promise<Context>

    export { getHandler }
  }

  export namespace view {
    /**
     * A hook for retrieving the stored value of a Config Value
     * @param signals Array of Signals to run
     * @param context Context object
     * @returns handler function
     */
    export function useConfigValue(configValueName: MetadataKey): string

    export { useConfigValue }
  }

  export namespace wire {
    /**
     * Returns a Wire object by wire name, if one exists at the time that it is called. Does not update if the Wire changes.
     * @param wireName the name of the wire to use
     * @param context Context object
     * @returns Wire object, or undefined if no Wire with that name exists
     */
    export function getWire(
      wireName: string | undefined,
      context: Context,
    ): Wire | undefined
    /**
     * A hook to return a Wire object by wire name, which will update if any change is made to the Wire
     * @param wireName the name of the wire to use
     * @param context Context object
     * @returns Wire object
     */
    export function useWire(
      wireName: string | undefined,
      context: Context,
    ): Wire | undefined
    /**
     * A hook to return multiple Wire objects by their names, which will update if any changes are made to the Wires
     * @param wireNames the names of the wires to use
     * @param context Context object
     * @returns array of Wire objects
     */
    export function useWires(
      wireNames: string[],
      context: Context,
    ): (Wire | undefined)[]

    export { getWire, useWire, useWires }
  }

  export default { signal, view, wire }
}

export default {
  api,
  component,
  definition,
  styles,
  signal,
}
}
