import { DefinitionMap } from "./definition"
export type PanelDefinition = {
	title: string
	width: string
	height: string
	components: DefinitionMap[]
}

export type PanelDefinitionMap = {
	[key: string]: Record<string, PanelDefinition>[]
}
