import { FC, ReactNode } from "react"
import { Class, cx } from "@twind/core"

export type FieldMode = "READ" | "EDIT"

export type SiteState = {
	name: string
	app: string
	domain: string
	subdomain: string
	version: string
	title?: string
}

export type RouteState = {
	view: string
	params?: Record<string, string>
	namespace: string
	path: string
	theme: string
	title: string
	isLoading?: boolean
} | null

export type UserState = {
	id: string
	username: string
	site: string
	firstname: string
	lastname: string
	profile: string
	picture: UserPictureState | null
} | null

export type UserPictureState = {
	id: string
	updatedat: number
}

export interface Palette {
	primary: string
	secondary: string
	error: string
	warning: string
	info: string
	success: string
	// Allow any key as well, but require a minimum of the above
	[key: string]: string
}

export type ThemeState = {
	name: string
	namespace: string
	definition: {
		spacing: number
		palette: Palette
	}
}

export type Mergeable = string | number | boolean | undefined

export type DeepMergeable = Mergeable | Record<string, Mergeable> | Mergeable[]

export interface WireContext {
	wire: string
	view?: string
}

export interface RecordContext {
	view?: string
	wire: string
	record: string
}

export type Context = {
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
	 * Adds a Signal-specific context frame to the current stack
	 * @param label - the frame label or stepId
	 * @param data - arbitrary data to be associated with this signal output context frame
	 * @returns new Context object
	 */
	addSignalOutputFrame: (label: string, data: unknown) => Context
	/**
	 * Adds a record data frame to the current stack
	 * @param recordData - the record data frame to add
	 * @param index - the record's zero-indexed position within its parent array/collection
	 * @returns new Context object
	 */
	addRecordDataFrame: (recordData: PlainWireRecord, index?: number) => Context

	/**
	 * Adds a record context frame to the current stack
	 * @param recordContext - the record context frame to add
	 * @returns new Context object
	 */
	addRecordFrame: (recordContext: RecordContext) => Context
	/**
	 * Adds a wire context frame to the current stack
	 * @param wireContext - the wire context frame to add
	 * @returns new Context object
	 */
	addWireFrame: (wireContext: WireContext) => Context
	/**
	 * Merges a template containing merge syntax, e.g. ${uesio/core.uniquekey} in the current context
	 * If the template specified is not a string or does not contain any merge syntax, the template
	 * is returned as-is.
	 * @param template - the template to be merged
	 * @returns the merged result
	 */
	merge: (template: Mergeable) => FieldValue
	/**
v	 * Merges a template containing merge syntax, e.g. ${uesio/core.uniquekey} in the current context
     * with the result coerced in to a string.
	 * If the template specified is not a string or does not contain any merge syntax, the value returned
	 * is the template coerced to a string.
	 * @param template - the template to be merged
	 * @returns the merged result as a string
	 */
	mergeString: (template: Mergeable) => string
	/**
	 * Merges a template containing merge syntax, e.g. ${uesio/core.uniquekey} in the current context
	 * with the result being the boolean resulting from the merge operation or the default value
	 * if the result of the merge operation did not yield a boolean typed value.
	 * If the template specified is not a string or does not contain any merge syntax, the result of the
	 * merge operation will be the template as-is which will then be returned directly if it is a boolean
	 * type or the default value if not.
	 * @param template - the template to be merged
	 * @returns the merged result as a boolean
	 */
	mergeBoolean: (template: Mergeable, defaultValue: boolean) => boolean
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
	 * Returns the stable, unique id of the closest context Record
	 * @returns string
	 */
	getRecordIdFieldValue: () => string
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
export type MetadataKey = `${string}/${string}.${string}`

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
	cx,
}

//
// COMPONENT
//

export interface SlotUtilityProps extends UtilityProps {
	path: string
	definition?: DefinitionMap
	listName?: string
	// componentType will be populated if we're coming from a Declarative Component,
	// where we need to be able to lookup the Slot metadata.
	componentType?: MetadataKey
}

export interface UtilityPropsPlus extends UtilityProps {
	[x: string]: unknown
}

export namespace component {
	export namespace registry {
		export function register(key: MetadataKey, componentType: UC): void
		export function registerUtilityComponent(
			key: MetadataKey,
			componentType: FC<UtilityProps>
		): void
	}
	export function Component(...args: Parameters<UC>): ReturnType<UC>
	export function Slot(
		...args: Parameters<FC<SlotUtilityProps>>
	): ReturnType<FC>
	export function getUtility<T extends UtilityProps = UtilityPropsPlus>(
		key: MetadataKey
	): UtilityComponent<T>
}

//
// DEFINITION
//
export namespace definition {
	export type {
		BaseProps,
		UC,
		UtilityComponent,
		DefinitionMap,
		DefinitionList,
		DefinitionValue,
		Definition,
		BaseDefinition,
	}
}

export const PARAM = "PARAM"
export const LOOKUP = "LOOKUP"
export const VALUE = "VALUE"
export const SEARCH = "SEARCH"
export const GROUP = "GROUP"
export type Conjunction = "AND" | "OR"
export type ConditionOperators =
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
export type WireCondition =
	| ParamCondition
	| LookupCondition
	| ValueCondition
	| SearchCondition
	| GroupCondition
export type ConditionBase = {
	id?: string
	operator?: ConditionOperators
	inactive?: boolean
}
export type GroupCondition = ConditionBase & {
	type: typeof GROUP
	conjunction: Conjunction
	conditions: ConditionBase[]
	valueSource: undefined
}
export type SearchCondition = ConditionBase & {
	type: typeof SEARCH
	value: string
	valueSource?: undefined
	fields?: string[]
}
export type ParamCondition = ConditionBase & {
	type?: undefined
	field: string
	valueSource: typeof PARAM
	param: string
}
export type LookupCondition = ConditionBase & {
	type?: undefined
	field: string
	valueSource: typeof LOOKUP
	lookupWire: string
	lookupField: string
}
export type ValueCondition = ConditionBase & {
	type?: undefined
	field: string
	valueSource: typeof VALUE | undefined
	value: PlainFieldValue
	start?: PlainFieldValue
	end?: PlainFieldValue
	inclusiveStart?: boolean
	inclusiveEnd?: boolean
}

export type FieldType =
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

export type AcceptTypes = "IMAGE" | "AUDIO" | "VIDEO" | "DOCUMENT" | "ANY"

export type SelectOption = {
	label: string
	value: string
	languageLabel?: string
	disabled?: boolean
	title?: string
}

export type NumberMetadata = {
	decimals: number
}

export type SelectListMetadata = {
	name: string
	options: SelectOption[]
	blank_option_label?: string
	blank_option_language_label?: string
}

export type FileMetadata = {
	accept: AcceptTypes
	filesource: string
}

export type ReferenceMetadata = {
	collection: string
}

export type ReferenceGroupMetadata = {
	collection: string
	field: string
}

export type GetSelectOptionsProps = {
	context: Context
	// A blank option is added by default, but can be disabled by setting this to false
	addBlankOption?: boolean
}

/**
 * API for interacting with the Fields on a Collection
 */
export type Field = {
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
export type WireField = {
	id: string
	fields?: WireField[]
}

export interface CreateRecordsOptions {
	context: Context
	records: PlainWireRecord[]
	prepend?: boolean
}

export type Wire = {
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
export type FieldValue =
	| PlainFieldValue
	| PlainWireRecord
	| PlainFieldValue[]
	| PlainWireRecord[]
export type PlainWireRecord = {
	[key: string]: FieldValue
}
export type PlainFieldValue = string | number | boolean | undefined | null
export type WireRecord = {
	/**
	 * Returns the unique id of this record
	 */
	getId: () => string
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

export type OrderState = {
	field: MetadataKey
	desc: boolean
}

export type PlainWire = {
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
	export { SignalDefinition, ComponentSignalDescriptor }
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

		/**
		 * Runs a single signal
		 * @param signal Signal to run
		 * @param context Context object
		 * @returns a promise with a new Context that could have been altered by the signal
		 */
		export function run(
			signal: SignalDefinition,
			context: Context
		): Promise<Context>

		/**
		 * Runs a set of signals
		 * @param signals Array of Signals to run
		 * @param context Context object
		 * @returns a promise with a new Context that could have been altered by the signal
		 */
		export function runMany(
			signals: SignalDefinition[],
			context: Context
		): Promise<Context>
	}

	export namespace view {
		/**
		 * A hook for retrieving the stored value of a Config Value
		 * @param signals Array of Signals to run
		 * @param context Context object
		 * @returns handler function
		 */
		export function useConfigValue(configValueName: MetadataKey): string
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
	}

	export namespace file {
		/**
		 * Returns the URL of a File
		 * @param context Context object
		 * @param fullName Full name of the file
		 * @param filePath Path to the file
		 * @returns URL of the File
		 */
		export function getURLFromFullName(
			context: Context,
			fullName: string,
			filePath?: string
		): string
		/**
		 * Returns the URL of a User File
		 * @param context Context object
		 * @param userfileid Id of the User File
		 * @param fileVersion Version of the User File
		 * @returns URL of the User File
		 */
		export function getUserFileURL(
			context: Context,
			userfileid?: string,
			fileVersion?: string
		): string
		/**
		 * Returns the URL of the Attachment
		 * @param context Context object
		 * @param recordid Id of the record
		 * @param path Path to the attachment
		 * @param fileVersion Version of the attachment
		 * @returns URL of the Attachment
		 */
		export function getAttachmentURL(
			context: Context,
			recordid: string,
			path: string,
			fileVersion?: string
		): string
		/**
		 * A hook to return the content of a user file
		 * @param context Context object
		 * @param userFile User file record
		 * @returns content of the file
		 */
		export function useUserFile(
			context: Context,
			userFile: PlainWireRecord | undefined
		): string
		/**
		 * A hook to return the content of a file
		 * @param context Context object
		 * @param fileId the id of the file
		 * @returns content of the file
		 */
		export function useFile(context: Context, fileId?: string): string
	}
}
