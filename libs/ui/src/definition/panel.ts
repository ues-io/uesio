import { DefinitionMap } from "./definition"
import { MetadataKey } from "../metadataexports"
export type PanelDefinition = {
	"uesio.type": MetadataKey
	title: string
	width: string
	height: string
	components: DefinitionMap[]
}

export type PanelDefinitionMap = Record<string, PanelDefinition>
