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
}
type Logger = (message: string, ...data: unknown[]) => void

interface LogApi {
	info: Logger
	warn: Logger
	error: Logger
}
interface DeleteApi {
	getOld: (field: string) => FieldValue
}
interface ChangeApi {
	get: (field: string) => FieldValue
	getOld: (field: string) => FieldValue
	set: (field: string, value: FieldValue) => void
	addError: (error: string) => void
}
interface InsertsApi {
	get: () => ChangeApi[]
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
	body?: string | Record<string, unknown>
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

interface IntegrationMetadata {
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
interface LoadBotApi {
	addError: (error: string) => void
	setData: (data: Record<string, unknown>[]) => void
	loadRequest: LoadRequest
	getIntegration: () => IntegrationMetadata
	getCredentials: () => Record<string, string | undefined>
	getConfigValue: (configValueKey: string) => string
	getSession: () => SessionApi
	getUser: () => UserApi
	log: LogApi
	http: HttpApi
}
export type {
	ListenerBotApi,
	LoadBotApi,
	BeforeSaveBotApi,
	AfterSaveBotApi,
	BotParamsApi,
	ConditionOperator,
	ConditionRequest,
	ConditionType,
	ChangeApi,
	FieldRequest,
	FieldValue,
	LoadOrder,
	LoadRequest,
	WireRecord,
}
