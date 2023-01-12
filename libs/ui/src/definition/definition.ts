import { CSSInterpolation } from "@emotion/css"
import { ReactNode } from "react"
import yaml from "yaml"
import { MetadataKey } from "../bands/builder/types"
import { DisplayCondition } from "../component/display"
import { Context } from "../context/context"
import { WireConditionState } from "../wireexports"

export type BaseDefinition = {
	"uesio.styles"?: Record<string, Record<string, string>>
	"uesio.variant"?: MetadataKey
	"uesio.display"?: DisplayCondition[]
} & DefinitionMap

export type YamlDoc = yaml.Document<yaml.Node>

export type ImportMapping = {
	type: "IMPORT" | "VALUE"
	columnname?: string
	value?: string
}

export type Spec = ImportSpec | ExportSpec | UploadSpec

export type ImportSpec = {
	jobtype: "IMPORT"
	collection: string
	filetype: "CSV" | "TAB" | undefined
	mappings: Record<string, ImportMapping>
}

export type ExportSpec = {
	jobtype: "EXPORT"
	collection: string
	filetype: "CSV"
	conditions?: WireConditionState[]
}

export type UploadSpec = {
	jobtype: "UPLOADFILES"
	collection: string
	uploadfield?: string
}

export type BaseProps = {
	definition?: BaseDefinition
	index?: number
	path?: string
	componentType?: MetadataKey
	context: Context
	children?: ReactNode
}

export interface UtilityProps {
	index?: number
	path?: string
	variant?: MetadataKey
	styles?: Record<string, CSSInterpolation>
	classes?: Record<string, string>
	className?: string
	context: Context
	children?: ReactNode
	componentType?: MetadataKey
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
