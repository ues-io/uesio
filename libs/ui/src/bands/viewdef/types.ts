import {
	DefinitionList,
	DefinitionMap,
	YamlDoc,
} from "../../definition/definition"
import { WireDefinitionMap } from "../../definition/wire"

type ConfigValueDependencies = {
	[key: string]: string
}

type ComponentPackDependency = {
	loaded: boolean
}
export type ComponentVariant = {
	name: string
	namespace: string
	label: string
	component: string
	definition: DefinitionMap
}
type ComponentVariants = {
	[key: string]: ComponentVariant
}
type ComponentPackDependencies = {
	[key: string]: ComponentPackDependency
}

type Dependencies = {
	configvalues: ConfigValueDependencies
	componentpacks: ComponentPackDependencies
	componentvariants: ComponentVariants
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
	panels: DefinitionList
}

export { PlainViewDef, PlainViewDefMap, Dependencies }
