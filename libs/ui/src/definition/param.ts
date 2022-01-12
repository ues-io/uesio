export type ParamDefinition = {
	"uesio.type": ParamTypes
	collection: string
}

export type ParamTypes = "record" | "text"

export type ParamDefinitionMap = Record<string, ParamDefinition>
