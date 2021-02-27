import yaml from "yaml"
import { Context } from "../context/context"

export type YamlDoc = yaml.Document

export type BaseProps = {
	definition?: DefinitionMap
	index?: number
	path: string
	componentType?: string
	context: Context
}

export interface UtilityProps extends BaseProps {
	[x: string]: unknown
}
export type BaseDefinition = {
	"uesio.styles"?: Record<string, Record<string, string>>
}
export type DefinitionMap = {
	[key: string]: Definition
}

export type DefinitionList = DefinitionMap[]

export type DefinitionValue = string | number | boolean | null | undefined

export type Definition =
	| DefinitionValue
	| DefinitionMap
	| string[]
	| number[]
	| DefinitionMap[]
