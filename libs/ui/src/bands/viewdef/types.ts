import { DefinitionList, YamlDoc } from "../../definition/definition"
import { WireDefinitionMap } from "../../definition/wire"
import { PanelDefinitionMap } from "../../definition/panel"

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

type ViewDefinition = {
	components: DefinitionList
	wires: WireDefinitionMap
	panels: PanelDefinitionMap
}

export { PlainViewDef, PlainViewDefMap, Dependencies }
