import { CSSInterpolation } from "@emotion/css"
import { ReactNode } from "react"
import yaml from "yaml"
import { Context } from "../context/context"

export type BaseDefinition = {
	"uesio.styles"?: Record<string, Record<string, string>>
	"uesio.variant"?: string
} & DefinitionMap

export type YamlDoc = yaml.Document<yaml.Node>

export type ImportMapping = {
	type: "IMPORT" | "VALUE"
	columnname?: string
	matchfield?: string
	value?: string
}

export type Spec = ImportSpec | ExportSpec | UploadSpec

export type ImportSpec = {
	jobtype: "IMPORT"
	collection: string
	filetype: "CSV" | "TAB" | undefined
	upsertkey: string
	mappings: Record<string, ImportMapping>
}

export type ExportSpec = {
	jobtype: "EXPORT"
	collection: string
	filetype: "CSV"
}

export type UploadSpec = {
	jobtype: "UPLOADFILES"
	collection: string
	upsertkey: string
	uploadfield?: string
}

export type BaseProps = {
	definition?: BaseDefinition
	index?: number
	path?: string
	componentType?: string
	context: Context
	children?: ReactNode
}

export interface UtilityProps {
	index?: number
	path?: string
	variant?: string
	styles?: Record<string, CSSInterpolation>
	classes?: Record<string, string>
	className?: string
	context: Context
	children?: ReactNode
	componentType?: string
}

export interface UtilityPropsPlus extends UtilityProps {
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
