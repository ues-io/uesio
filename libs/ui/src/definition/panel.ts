import { DefinitionMap } from "./definition"
export type PanelDefinition = {
	title: string
	width: string
	height: string
	components: DefinitionMap[]
}

export type PanelFieldDefinitionMap = {
	[x: string]: Record<string, PanelDefinition>[]
}
