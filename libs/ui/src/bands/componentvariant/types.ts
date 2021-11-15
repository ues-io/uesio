import { DefinitionMap, YamlDoc } from "../../definition/definition"

type ComponentVariant = {
	name: string
	namespace: string
	label: string
	extends?: string
	component: string
	definition: DefinitionMap
	yaml?: YamlDoc
	originalYaml?: YamlDoc
}

type ComponentVariantMap = {
	[key: string]: ComponentVariant
}

export { ComponentVariant, ComponentVariantMap }
