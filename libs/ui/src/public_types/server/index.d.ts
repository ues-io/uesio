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
}
interface UserApi {
	getId: () => string
	getUsername: () => string
	getEmail: () => string
	getUniqueKey: () => string
}

interface BotHttpRequest {
	url: string
	method: string
	headers?: Record<string, string>
	body?: string | Record<string, unknown> | unknown[]
}
interface BotHttpResponse {
	code: number
	status: string
	headers: Record<string, string>
	body: string | Record<string, unknown> | null
}

interface HttpApi {
	request: (options: BotHttpRequest) => BotHttpResponse
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
	deletes: DeletesApi
	inserts: InsertsApi
	updates: UpdatesApi
	callBot: CallBot
	log: LogApi
}
interface AfterSaveBotApi extends BeforeSaveBotApi {
	save: (collectionName: string, records: WireRecord[]) => void
	delete: (collectionName: string, records: WireRecord[]) => void
	runIntegrationAction: RunIntegrationAction
	getConfigValue: (configValueKey: string) => string
	asAdmin: AsAdminApi
}
interface AsAdminApi {
	load: (loadRequest: LoadRequest) => Record<string, FieldValue>[]
	delete: (collectionName: string, records: WireRecord[]) => void
	save: (collectionName: string, records: WireRecord[]) => void
	runIntegrationAction: RunIntegrationAction
	callBot: CallBot
	getConfigValue: (configValueKey: string) => string
}
interface ListenerBotApi {
	addResult: (key: string, value: FieldValue | undefined) => void
	load: (loadRequest: LoadRequest) => Record<string, FieldValue>[]
	params: BotParamsApi
	delete: (collectionName: string, records: WireRecord[]) => void
	save: (collectionName: string, records: WireRecord[]) => void
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
	save: (collectionName: string, records: WireRecord[]) => void
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
}
export type {
	AfterSaveBotApi,
	BeforeSaveBotApi,
	BotParamsApi,
	ChangeApi,
	ConditionOperator,
	ConditionRequest,
	ConditionType,
	DeleteApi,
	FieldRequest,
	FieldValue,
	InsertApi,
	ListenerBotApi,
	LoadBotApi,
	LoadOrder,
	LoadRequest,
	LoadRequestMetadata,
	RunActionBotApi,
	SaveBotApi,
	WireRecord,
}
