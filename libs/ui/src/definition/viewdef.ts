import { DefinitionList, DefinitionMap } from "./definition"
import { WireDefinitionMap } from "./wire"
import { PanelDefinitionMap } from "./panel"
import { ParamDefinitionMap } from "./param"
import { SignalDefinition } from "./signal"

type ComponentPackDependency = {
	loaded: boolean
}

type FeatureFlagDependency = {
	name: string
	namespace: string
	value: boolean
	user: string
}

type Dependencies = {
	configvalues: Record<string, string>
	labels: Record<string, string>
	componentpacks: Record<string, ComponentPackDependency>
	featureflags: Record<string, FeatureFlagDependency>
	componentvariants: Record<string, DefinitionMap>
}

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
	dependencies?: Dependencies
}

type ViewDefinition = {
	components: DefinitionList
	wires?: WireDefinitionMap
	panels?: PanelDefinitionMap
	events?: ViewEventsDef
	params?: ParamDefinitionMap
}

export { PlainViewDef, PlainViewDefMap, Dependencies, ViewDefinition }
