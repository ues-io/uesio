import { DefinitionMap, YamlDoc } from "../../definition/definition"

type ComponentVariantDef = {
	name: string
	definition?: DefinitionMap
	yaml?: YamlDoc
	originalYaml?: YamlDoc
}

type ComponentVariantDefMap = {
	[key: string]: ComponentVariantDef
}

export { ComponentVariantDef, ComponentVariantDefMap }
