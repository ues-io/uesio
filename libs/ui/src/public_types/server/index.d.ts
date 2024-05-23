type BotParamValue = string | boolean | number | object | undefined

interface BotParamsApi {
	get: (paramName: string) => BotParamValue
	getAll: () => Record<string, BotParamValue>
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
type FieldValue = string | number | boolean | object | null
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
		options: BotHttpRequest<RequestBody>
	) => BotHttpResponse<ResponseBody>
}

interface SaveOptionsApi {
	upsert: boolean
}

interface IntegrationApi {
	getBaseURL(): string | undefined
}

type RunIntegrationAction = (
	integration: string,
	action: string,
	options: unknown
) => unknown

type CallBot = (
	botName: string,
	params: Record<string, FieldValue>
) => Record<string, FieldValue>

interface BeforeSaveBotApi {
	addError: (error: string) => void
	load: (loadRequest: LoadRequest) => Record<string, FieldValue>[]
	save: (
		collectionName: string,
		records: WireRecord[],
		options?: {
			upsert?: boolean
		}
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
		}
	) => Record<string, FieldValue>[]
	runIntegrationAction: RunIntegrationAction
	callBot: CallBot
	getConfigValue: (configValueKey: string) => string
}
interface ListenerBotApi {
	addResult: (key: string, value: FieldValue | undefined) => void
	load: (loadRequest: LoadRequest) => Record<string, FieldValue>[]
	params: BotParamsApi
	delete: (collectionName: string, records: WireRecord[]) => void
	save: (
		collectionName: string,
		records: WireRecord[],
		options?: {
			upsert?: boolean
		}
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
		destField: string
	) => void
	copyUserFile: (
		sourceFileId: string,
		destCollection: string,
		destRecord: string,
		destField: string
	) => void
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
		}
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
		url: string
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
		}
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
