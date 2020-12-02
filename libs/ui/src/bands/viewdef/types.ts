import { DefinitionMap, YamlDoc } from "../../definition/definition"
import Dependencies from "../../store/types/dependenciesstate"

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
	wires: DefinitionMap
}

export { PlainViewDef, PlainViewDefMap }
