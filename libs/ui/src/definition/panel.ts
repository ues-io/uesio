import { DefinitionMap } from "./definition"
import { MetaDataKey } from "../utilexports"
export type PanelDefinition = {
	"uesio.type": MetaDataKey
	title: string
	width: string
	height: string
	components: DefinitionMap[]
}

export type PanelDefinitionMap = Record<string, PanelDefinition>
