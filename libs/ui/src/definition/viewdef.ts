import { DefinitionList } from "./definition"
import { WireDefinitionMap } from "./wire"
import { PanelDefinitionMap } from "./panel"
import { ParamDefinition } from "./param"
import { SignalDefinition } from "./signal"

type PlainViewDefMap = {
	[key: string]: PlainViewDef
}

type ViewEventsDef = {
	onload: SignalDefinition[]
}

type PlainViewDef = {
	name: string
	namespace: string
	definition: ViewDefinition
}

type ViewDefinition = {
	components: DefinitionList
	wires?: WireDefinitionMap
	panels?: PanelDefinitionMap
	events?: ViewEventsDef
	params?: Record<string, ParamDefinition>
}

export type { PlainViewDef, PlainViewDefMap, ViewDefinition, ViewEventsDef }
