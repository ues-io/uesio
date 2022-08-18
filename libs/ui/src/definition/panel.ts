import { MetadataKey } from "../bands/builder/types"
import { DefinitionMap } from "./definition"

export type PanelDefinition = {
	"uesio.type": MetadataKey
	title: string
	width: string
	height: string
	components: DefinitionMap[]
}

export type PanelDefinitionMap = Record<string, PanelDefinition>
