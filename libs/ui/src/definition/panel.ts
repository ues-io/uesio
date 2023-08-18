import type { MetadataKey } from "../bands/builder/types"
import type { DefinitionList } from "./definition"
import type { SignalDefinition } from "./signal"

export interface PanelDefinition {
	"uesio.type": MetadataKey
	title?: string
	width?: string
	height?: string
	components?: DefinitionList
	actions?: DefinitionList
	afterClose?: SignalDefinition[]
}

export type PanelDefinitionMap = Record<string, PanelDefinition>
