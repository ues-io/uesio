import { DefinitionMap, YamlDoc, Definition } from "../../definition/definition"
import { WireDefinitionMap } from "../../definition/wire"
import { EntityPayload } from "../utils"

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

type AddDefinitionPayload = {
	path: string
	definition: Definition
	index?: number
} & EntityPayload

type PlainViewDef = {
	name: string
	namespace: string
	definition?: ViewDefinition
	yaml?: YamlDoc
	dependencies?: Dependencies
	originalYaml?: YamlDoc
	lastAddedDefinition?: AddDefinitionPayload
}

type PlainViewDefMap = {
	[key: string]: PlainViewDef
}

type ViewDefinition = {
	components: DefinitionMap
	wires: WireDefinitionMap
}

export { AddDefinitionPayload, PlainViewDef, PlainViewDefMap, Dependencies }
