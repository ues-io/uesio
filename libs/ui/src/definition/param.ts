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
		| "LIST"
		| "METADATA"
		| "METADATANAME"
		| "MULTIMETADATA"
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
type ListParam = ParamBase & {
	type: "LIST"
	default?: string
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
	| SelectParam
	| CheckboxParam
	| NumberParam
	| MetadataNameParam
	| MetadataParam
	| MultiMetadataParam

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
