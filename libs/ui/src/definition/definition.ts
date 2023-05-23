import { FC, ReactNode } from "react"
import { MetadataKey } from "../bands/builder/types"
import { DisplayCondition } from "../component/display"
import { Context } from "../context/context"
import { ComponentSignalDescriptor } from "./signal"

export type BaseDefinition = {
	// "id" here is TEMPORARY - for backwards compatibility on components like Table/List/Deck that initially had "id"
	// Once morandi / timetracker / etc. are migrated to using "uesio.id" in their metadata, we can remove this affordance.
	id?: string
	"uesio.id"?: string
	"uesio.styleTokens"?: Record<string, string[]>
	"uesio.variant"?: MetadataKey
	"uesio.display"?: DisplayCondition[]
	"uesio.classes"?: DisplayCondition[]
}

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
}

export type UploadSpec = {
	jobtype: "UPLOADFILES"
	collection: string
	uploadfield?: string
}

export type BaseProps<T = DefinitionMap> = {
	definition: T & BaseDefinition
	path: string
	componentType?: MetadataKey
	context: Context
	children?: ReactNode
}

export type UC<T = DefinitionMap> = FC<BaseProps<T>> & {
	signals?: Record<string, ComponentSignalDescriptor>
}

export type UtilityComponent<T = DefinitionMap> = FC<T & UtilityProps>

export interface UtilityProps {
	id?: string
	variant?: MetadataKey
	styleTokens?: Record<string, string[]>
	classes?: Record<string, string>
	className?: string
	context: Context
	children?: ReactNode
}

export type DefinitionMap = Record<string, unknown>

export type DefinitionList = DefinitionMap[]

export type DefinitionValue = unknown

export type Definition =
	| DefinitionValue
	| DefinitionMap
	| DefinitionValue[]
	| DefinitionMap[]
