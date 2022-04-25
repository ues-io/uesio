import {
	DefinitionList,
	DefinitionMap,
	YamlDoc,
} from "../../definition/definition"
import { WireDefinitionMap } from "../../definition/wire"
import { PanelDefinitionMap } from "../../definition/panel"
import { SignalDefinition } from "../../signalexports"
import { ParamDefinition } from "../../definition/param"

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

type PlainViewDef = {
	name: string
	namespace: string
	definition: ViewDefinition
	yaml?: YamlDoc
	dependencies?: Dependencies
	originalYaml?: YamlDoc
}

type PlainViewDefMap = {
	[key: string]: PlainViewDef
}

type ViewEventsDef = {
	onload: SignalDefinition[]
}

type PlainViewDef2 = {
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
	params?: ParamDefinition
}

export {
	PlainViewDef,
	PlainViewDef2,
	PlainViewDefMap,
	Dependencies,
	ViewDefinition,
}
