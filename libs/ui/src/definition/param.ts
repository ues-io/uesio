export type ParamDefinition = {
	type: ParamTypes
	collection: string
	required: boolean
	defaultValue: string
}

export type ParamTypes = "record" | "text"

export type ParamDefinitionMap = Record<string, ParamDefinition>
