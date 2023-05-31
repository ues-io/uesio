import { MetadataKey } from "../bands/builder/types"
import { DefinitionMap } from "./definition"
import { SignalDefinition } from "./signal"

export type PanelDefinition = {
	"uesio.type": MetadataKey
	title: string
	width: string
	height: string
	components: DefinitionMap[]
	afterClose?: SignalDefinition[]
}

export type PanelDefinitionMap = Record<string, PanelDefinition>
