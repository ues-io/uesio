import type { MetadataKey, MetadataType } from "../metadata/types"
import { CollectionKey } from "../bands/wire/types"
import { DisplayOperator } from "../component/display"

export type ParamCondition = {
	param: string
	value?: string | boolean | number
	values?: string[] | boolean[] | number[]
	type: "fieldValue" | "hasValue" | "hasNoValue"
	operator?: DisplayOperator
}

type ParamBase = {
	// name will only be populated for Bot Params
	name: string
	label?: string
	type?:
		| "RECORD"
		| "TEXT"
		| "LIST"
		| "MAP"
		| "METADATA"
		| "METADATANAME"
		| "MULTIMETADATA"
		| "NUMBER"
		| "SELECT"
		| "CHECKBOX"
	required?: boolean
	prompt?: string
	conditions?: ParamCondition[]
	default?: unknown
}

type RecordParam = ParamBase & {
	type: "RECORD"
	collection: CollectionKey
}

type TextParam = ParamBase & {
	type: "TEXT" | "" | undefined | null
	default?: string
}

type NumberParam = ParamBase & {
	type: "NUMBER"
	default?: number
}
type ListParam = ParamBase & {
	type: "LIST"
	default?: string
}
type MapParam = ParamBase & {
	type: "MAP"
	default?: string
}

type CheckboxParam = ParamBase & {
	type: "CHECKBOX"
	default?: boolean
}

export type SelectParam = ParamBase & {
	type: "SELECT"
	default?: string
	selectList: string
}

type MetadataParamBase = ParamBase & {
	metadataType: MetadataType
	grouping?: string
}

type MetadataParam = MetadataParamBase & {
	type: "METADATA"
}

type MultiMetadataParam = MetadataParamBase & {
	type: "MULTIMETADATA"
}

type MetadataNameParam = ParamBase & {
	type: "METADATANAME"
}

/**
 * Defines a Bot parameter
 */
export type ParamDefinition =
	| RecordParam
	| TextParam
	| ListParam
	| MapParam
	| SelectParam
	| CheckboxParam
	| NumberParam
	| MetadataNameParam
	| MetadataParam
	| MultiMetadataParam

type ViewParamBase = {
	type?: "RECORD" | "TEXT" | "CHECKBOX" | "NUMBER" | "SELECT"
	label?: string
	required?: boolean
}
type ViewRecordParam = {
	type: "RECORD"
	collection: MetadataKey
	default?: string
} & ViewParamBase
type ViewTextParam = {
	type: "TEXT"
	default?: string
} & ViewParamBase
type ViewCheckboxParam = {
	type: "CHECKBOX"
	default?: boolean
} & ViewParamBase
type ViewNumberParam = {
	type: "NUMBER"
	default?: number
} & ViewParamBase
type ViewSelectParam = {
	type: "SELECT"
	default?: string
	selectList?: MetadataKey
} & ViewParamBase

/**
 * Defines a parameter that a view expects to be provided.
 */
export type ViewParamDefinition =
	| ViewRecordParam
	| ViewTextParam
	| ViewCheckboxParam
	| ViewNumberParam
	| ViewSelectParam
