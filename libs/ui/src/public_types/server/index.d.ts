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
	| "IS_BLANK"
	| "IS_NOT_BLANK"
type FieldValue = string | number | boolean | object | null
type ConditionType = "SEARCH" | "GROUP"
interface ConditionRequest {
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

interface BeforeSaveBotApi {
	addError: (error: string) => void
	load: (loadRequest: LoadRequest) => WireRecord[]
	deletes: DeletesApi
	inserts: InsertsApi
	updates: UpdatesApi
}
interface AfterSaveBotApi extends BeforeSaveBotApi {
	save: (collectionName: string, records: WireRecord[]) => void
	runIntegrationAction: RunIntegrationAction
	getConfigValue: (configValueKey: string) => string
	asAdmin: AsAdminApi
}
interface AsAdminApi {
	load: (loadRequest: LoadRequest) => WireRecord[]
	save: (collectionName: string, records: WireRecord[]) => void
	runIntegrationAction: RunIntegrationAction
	getConfigValue: (configValueKey: string) => string
}
interface ListenerBotApi {
	addResult: (key: string, value: FieldValue | undefined) => void
	load: (loadRequest: LoadRequest) => WireRecord[]
	params: BotParamsApi
	save: (collectionName: string, records: WireRecord[]) => void
	runIntegrationAction: RunIntegrationAction
	getConfigValue: (configValueKey: string) => string
	asAdmin: AsAdminApi
	getSession: () => SessionApi
	getUser: () => UserApi
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
	load: (loadRequest: LoadRequest) => WireRecord[]
	log: LogApi
	params: BotParamsApi
	save: (collectionName: string, records: WireRecord[]) => void
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

interface FieldMetadata {
	accessible: boolean
	createable: boolean
	externalName?: string
	label: string
	name: string
	namespace: string
	type: FieldType
	updateable: boolean
}

interface CollectionMetadata {
	accessible: boolean
	getFieldMetadata: (fieldId: string) => FieldMetadata
	getAllFieldMetadata: () => Record<string, FieldMetadata>
	deleteable: boolean
	createable: boolean
	externalName?: string
	label: string
	labelPlural: string
	name: string
	namespace: string
	updateable: boolean
}

interface LoadRequestMetadata {
	batchNumber?: number
	batchSize?: number
	collection: string
	collectionMetadata: CollectionMetadata
	conditions?: ConditionRequest[]
	fields?: FieldRequest[]
	order?: LoadOrder[]
}

interface SaveRequestMetadata {
	collection: string
	collectionMetadata: CollectionMetadata
	upsert: boolean
}

interface LoadBotApi {
	addError: (error: string) => void
	addRecord: (record: Record<string, unknown>) => void
	loadRequest: LoadRequestMetadata
	getIntegration: () => IntegrationApi
	getCredentials: () => Record<string, string | undefined>
	getConfigValue: (configValueKey: string) => string
	getSession: () => SessionApi
	getUser: () => UserApi
	// setHasMoreRecords - call this to indicate that the server could return more records
	// in subsequent pages/batches.
	setHasMoreRecords: () => void
	log: LogApi
	http: HttpApi
}
interface SaveBotApi {
	addError: (message: string, fieldId: string, recordId: string) => void
	deletes: DeletesApi
	inserts: InsertsApi
	updates: UpdatesApi
	saveRequest: SaveRequestMetadata
	getIntegration: () => IntegrationApi
	getCredentials: () => Record<string, string | undefined>
	getConfigValue: (configValueKey: string) => string
	getSession: () => SessionApi
	getUser: () => UserApi
	log: LogApi
	http: HttpApi
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
	RunActionBotApi,
	SaveBotApi,
	WireRecord,
}
