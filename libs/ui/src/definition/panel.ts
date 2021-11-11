import { DefinitionMap } from "./definition"
export type PanelDefinition = {
	type: string
	title: string
	width: string
	height: string
	components: DefinitionMap[]
}

export type PanelDefinitionMap = {
	[key: string]: PanelDefinition
}
