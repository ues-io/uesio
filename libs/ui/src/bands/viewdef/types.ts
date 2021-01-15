import { DefinitionMap, YamlDoc } from "../../definition/definition"
import { WireDefinitionMap } from "../../definition/wire"

type ConfigValueDependencies = {
	[key: string]: string
}

type ComponentPackDependency = {
	loaded: boolean
}

type ComponentPackDependencies = {
	[key: string]: ComponentPackDependency
}

type Dependencies = {
	configvalues: ConfigValueDependencies
	componentpacks: ComponentPackDependencies
}

type PlainViewDef = {
	name: string
	namespace: string
	definition?: ViewDefinition
	yaml?: YamlDoc
	dependencies?: Dependencies
	originalYaml?: YamlDoc
}

type PlainViewDefMap = {
	[key: string]: PlainViewDef
}

type ViewDefinition = {
	components: DefinitionMap
	wires: WireDefinitionMap
}

export { PlainViewDef, PlainViewDefMap, Dependencies }
