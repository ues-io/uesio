import { CSSInterpolation } from "@emotion/css"
import yaml from "yaml"
import { Context } from "../context/context"

export type BaseDefinition = {
	"uesio.styles"?: Record<string, Record<string, string>>
	"uesio.variant"?: string
} & DefinitionMap

export type YamlDoc = yaml.Document

export type BaseProps = {
	definition?: BaseDefinition
	index?: number
	path?: string
	componentType?: string
	context: Context
}

export interface UtilityProps extends BaseProps {
	variant?: string
	styles?: Record<string, CSSInterpolation>
	classes?: Record<string, string>
	className?: string
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
	| DefinitionValue[]
	| DefinitionMap[]
