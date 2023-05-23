import { FC, ReactNode } from "react"
import { Class } from "@twind/core"

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

// interface SignalDefinition {
//     signal: string;
//     stepId?: string;
// }

// type SignalApi = {
//     /**
//      * Returns a handler function for running a list of signals
//      * @param signals Array of Signals to run
//      * @param context Context object
//      * @returns handler function
//      */
//     getHandler: (signals: SignalDefinition[] | undefined, context: Context) => () => Context;
// };

// const Api: {
//     signal: SignalApi;
//     wire: WireApi;
// };

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
	active?: boolean
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

export default {
	component,
	definition,
	styles,
}
