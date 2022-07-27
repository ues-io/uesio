import { MetadataType } from "../bands/builder/types"

type ParamBase = {
	name: string
	type: "RECORD" | "TEXT" | "METADATA" | "METADATAMULTI" | "METADATANAME"
	required?: boolean
	default?: string
	prompt?: string
}

type RecordParam = ParamBase & {
	type: "RECORD"
	collection: string
}

type TextParam = ParamBase & {
	type: "TEXT"
	defaultValue: string
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

export type ParamDefinition =
	| RecordParam
	| TextParam
	| MetadataParam
	| MetadataMultiParam
	| MetadataNameParam
