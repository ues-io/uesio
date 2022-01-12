import { DefinitionList, YamlDoc } from "../../definition/definition"
import { WireDefinitionMap } from "../../definition/wire"
import { PanelDefinitionMap } from "../../definition/panel"
import { SignalDefinition } from "../../signalexports"
import { ParamDefinition } from "../../definition/param"

type ConfigValueDependencies = {
	[key: string]: string
}

type ComponentPackDependency = {
	loaded: boolean
}

type ComponentPackDependencies = {
	[key: string]: ComponentPackDependency
}

type FeatureFlagDependency = {
	name: string
	namespace: string
	value: boolean
	user: string
}

type FeatureFlagDependencies = {
	[key: string]: FeatureFlagDependency
}

type Dependencies = {
	configvalues: ConfigValueDependencies
	componentpacks: ComponentPackDependencies
	featureflags: FeatureFlagDependencies
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

type ViewDefinition = {
	components: DefinitionList
	wires?: WireDefinitionMap
	panels?: PanelDefinitionMap
	events?: ViewEventsDef
	params?: ParamDefinition
}

export { PlainViewDef, PlainViewDefMap, Dependencies }
