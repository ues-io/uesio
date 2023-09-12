import type { MetadataKey, MetadataType } from "../metadata/types"
import { CollectionKey } from "../bands/wire/types"

export type ParamCondition = {
	param: string
	value?: string | boolean | number
	type: "fieldValue" | "hasValue" | "hasNoValue"
}

type ParamBase = {
	// name will only be populated for Bot Params
	name: string
	type?:
		| "RECORD"
		| "TEXT"
		| "METADATA"
		| "METADATAMULTI"
		| "METADATANAME"
		| "NUMBER"
		| "SELECT"
		| "CHECKBOX"
	required?: boolean
	prompt?: string
	conditions?: ParamCondition[]
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

type CheckboxParam = ParamBase & {
	type: "CHECKBOX"
	default?: boolean
}

type SelectParam = ParamBase & {
	type: "SELECT"
	default?: string
	selectList: string
}

type MetadataParam = ParamBase & {
	type: "METADATA"
	metadataType: MetadataType
	grouping?: string
}

type MetadataMultiParam = ParamBase & {
	type: "METADATAMULTI"
	metadataType: MetadataType
	grouping?: string
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
	| SelectParam
	| CheckboxParam
	| NumberParam
	| MetadataParam
	| MetadataMultiParam
	| MetadataNameParam

type ViewParamBase = {
	required?: boolean
	default?: string
}
type ViewRecordParam = {
	type: "RECORD"
	collection: MetadataKey
} & ViewParamBase
type ViewTextParam = {
	type: "TEXT" | "" | undefined | null
} & ViewParamBase

/**
 * Defines a parameter that a view expects to be provided.
 */
export type ViewParamDefinition = ViewRecordParam | ViewTextParam
