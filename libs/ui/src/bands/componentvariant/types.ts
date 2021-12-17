import { DefinitionMap, YamlDoc } from "../../definition/definition"

export type ComponentVariant = {
	name: string
	namespace: string
	label: string
	extends?: string
	component: string
	definition: DefinitionMap
	yaml?: YamlDoc
	originalYaml?: YamlDoc
}
