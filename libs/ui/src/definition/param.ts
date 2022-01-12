export type ParamDefinition = {
	"uesio.type": ParamTypes
	collection: string
}

export type ParamTypes = "query" | "merge"

export type ParamDefinitionMap = Record<string, ParamDefinition>
