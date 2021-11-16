import { DefinitionMap } from "./definition"
export type PanelDefinition = {
	"uesio.type": string
	title: string
	width: string
	height: string
	components: DefinitionMap[]
}

export type PanelDefinitionMap = Record<string, PanelDefinition>
