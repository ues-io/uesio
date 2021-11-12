import { DefinitionMap, YamlDoc } from "../../definition/definition"

type ComponentVariantDef = {
	name: string
	namespace: string
	label: string
	component: string
	definition: DefinitionMap
	yaml?: YamlDoc
	originalYaml?: YamlDoc
}

type ComponentVariantDefMap = {
	[key: string]: ComponentVariantDef
}

export { ComponentVariantDef, ComponentVariantDefMap }
