type RecordParam = {
	type: "RECORD"
	collection: string
	required?: boolean
}

type TextParam = {
	type: "TEXT"
	required?: boolean
	defaultValue: string
}

export type ParamDefinition = RecordParam | TextParam

export type ParamDefinitionMap = Record<string, ParamDefinition>
