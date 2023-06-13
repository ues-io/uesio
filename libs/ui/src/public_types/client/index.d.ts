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
	COLLECTION: "collections"
	FIELD: "fields"
	VIEW: "views"
	DATASOURCE: "datasources"
	AUTHSOURCE: "authsources"
	FILESOURCE: "filesources"
	SIGNUPMETHOD: "signupmethods"
	SECRET: "secrets"
	THEME: "themes"
	SELECTLIST: "selectlists"
	BOT: "bots"
	CREDENTIALS: "credentials"
	ROUTE: "routes"
	PROFILE: "profiles"
	PERMISSIONSET: "permissionsets"
	COMPONENTVARIANT: "componentvariants"
	COMPONENTPACK: "componentpacks"
	COMPONENT: "components"
	FILE: "files"
	LABEL: "labels"
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
type WireField = {
	id: string
	fields?: WireField[]
}
type Wire = {
	cancel: () => void
	createRecord: (
		record: PlainWireRecord,
		prepend?: boolean,
		recordId?: string
	) => WireRecord
	empty: () => void
	getChanges: () => WireRecord[]
	getCollection: () => string
	getCondition: (conditionId: string) => WireCondition | null
	getConditions: () => WireCondition[]
	getData: () => WireRecord[]
	getDeletes: () => WireRecord[]
	getErrors: () => Record<string, string[]>
	getFields: () => Record<string, WireField>
	getFirstRecord: () => WireRecord
	getFullId: () => string
	getId: () => string
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
	getId: () => string
	getWire: () => string
	getFieldValue: <T extends FieldValue>(fieldName: string) => T | undefined
	isNew: () => boolean
	isDeleted: () => boolean
	getIdFieldValue: () => string
	getUniqueKey: () => string
	update: (fieldId: string, value: FieldValue, context: Context) => void
}
// type useWire = (wireId: string, context: Context) => Wire;

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

	export default { signal, view }
}

export default {
	api,
	component,
	definition,
	styles,
}
