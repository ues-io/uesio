declare module "@uesio/bots" {
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
	delete: (collectionName: string, records: WireRecord[]) => void
	save: (collectionName: string, records: WireRecord[]) => void
	runIntegrationAction: RunIntegrationAction
	getConfigValue: (configValueKey: string) => string
}
interface ListenerBotApi {
	addResult: (key: string, value: FieldValue | undefined) => void
	load: (loadRequest: LoadRequest) => WireRecord[]
	params: BotParamsApi
	delete: (collectionName: string, records: WireRecord[]) => void
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
}
declare module "@uesio/ui" {
import { FC, ReactNode } from "react"
import { Class } from "@twind/core"

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
		data: Record<string, unknown>
	) => Context
	/**
	 * Merges a text string containing merges, e.g. ${uesio/core.uniquekey} in the current context
	 * @param text - the text to be merged
	 * @returns the merged text
	 */
	merge: (text: string) => string
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
	defaultVariantComponentType?: MetadataKey
): Record<string, string>
declare function useStyleTokens(
	defaults: Record<string, Class[]>,
	props: BaseProps
): Record<string, string>

export const styles = {
	useUtilityStyleTokens,
	useStyleTokens,
}

//
// COMPONENT
//

export namespace component {
	export namespace registry {
		export function register(key: MetadataKey, componentType: UC): void
		export function registerUtilityComponent(
			key: MetadataKey,
			componentType: FC<UtilityProps>
		): void
	}
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

const PARAM = "PARAM"
const LOOKUP = "LOOKUP"
const VALUE = "VALUE"
const SEARCH = "SEARCH"
const GROUP = "GROUP"
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
	type: typeof GROUP
	conjunction: Conjunction
	conditions: ConditionBase[]
	valueSource: undefined
}
type SearchCondition = ConditionBase & {
	type: typeof SEARCH
	value: string
	valueSource?: undefined
	fields?: string[]
}
type ParamCondition = ConditionBase & {
	type?: undefined
	field: string
	valueSource: typeof PARAM
	param: string
}
type LookupCondition = ConditionBase & {
	type?: undefined
	field: string
	valueSource: typeof LOOKUP
	lookupWire: string
	lookupField: string
}
type ValueCondition = ConditionBase & {
	type?: undefined
	field: string
	valueSource: typeof VALUE | undefined
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
	getSelectMetadata: () => SelectListMetadata
	/**
	 * If this is a "Select" field, returns a list of SelectOptions,
	 * including a blank option if a blank option label is defined on the field
	 */
	getSelectOptions: (context: Context) => SelectOption[]
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
		recordId?: string
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
			context: Context
		): () => Context

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
			context: Context
		): Wire | undefined
		/**
		 * A hook to return a Wire object by wire name, which will update if any change is made to the Wire
		 * @param wireName the name of the wire to use
		 * @param context Context object
		 * @returns Wire object
		 */
		export function useWire(
			wireName: string | undefined,
			context: Context
		): Wire | undefined
		/**
		 * A hook to return multiple Wire objects by their names, which will update if any changes are made to the Wires
		 * @param wireNames the names of the wires to use
		 * @param context Context object
		 * @returns array of Wire objects
		 */
		export function useWires(
			wireNames: string[],
			context: Context
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
}
}
