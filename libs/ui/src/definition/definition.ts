import { Context } from "../context/context"
import yaml from "yaml"

export type YamlDoc = yaml.Document

export type BaseProps = {
	definition?: Definition
	style?: React.CSSProperties
	children?: React.ReactNode
	index?: number
	path: string
	componentType?: string
	context: Context
}

export type BasePropsPlus = BaseProps & {
	[x: string]: unknown
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

export type StateMap = {
	[key: string]: StateFragment
}

export type StateValue = DefinitionValue | YamlDoc

export type StateFragment = StateValue | StateMap | StateFragment[]
