import { CSSProperties } from "react"
import yaml from "yaml"
import { Context } from "../context/context"
import { EntityPayload } from "../bands/utils"

export type YamlDoc = yaml.Document

export type BaseProps = {
	definition?: DefinitionMap
	style?: CSSProperties
	index?: number
	path: string
	componentType?: string
	context: Context
}

export interface BasePropsPlus extends BaseProps {
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

export type AddDefinitionPayload = {
	path: string
	definition: Definition
	index?: number
} & EntityPayload
