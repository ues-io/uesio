import { BaseProps, BasePropsPlus } from "../definition/definition"
import { BuildPropertiesDefinition } from "../buildmode/buildpropdefinition"
import { parseKey, getPathSuffix } from "./path"
import toPath from "lodash.topath"
import NotFound from "../components/notfound"

type ComponentNamespaceRegistry = {
	[key: string]: ComponentRegistry
}

type ComponentRegistry = {
	[key: string]: React.ComponentType<BaseProps>
}

type DefinitionNamespaceRegistry = {
	[key: string]: DefinitionRegistry
}

type DefinitionRegistry = {
	[key: string]: BuildPropertiesDefinition
}

const registry: ComponentNamespaceRegistry = {}
const builderRegistry: ComponentNamespaceRegistry = {}
const definitionRegistry: DefinitionNamespaceRegistry = {}

function addToRegistry(
	registry: ComponentNamespaceRegistry | DefinitionNamespaceRegistry,
	namespace: string,
	name: string,
	componentType: React.ComponentType<BaseProps> | BuildPropertiesDefinition
): void {
	if (!registry[namespace]) {
		registry[namespace] = {}
	}
	registry[namespace][name] = componentType
}

function register(
	namespace: string,
	name: string,
	componentType: React.ComponentType<BaseProps>
): void {
	addToRegistry(registry, namespace, name, componentType)
}

function registerBuilder(
	namespace: string,
	name: string,
	componentType: React.ComponentType<BaseProps>,
	definition: BuildPropertiesDefinition | null
): void {
	addToRegistry(builderRegistry, namespace, name, componentType)
	definition && addToRegistry(definitionRegistry, namespace, name, definition)
}

function getBuildtimeLoader(
	namespace: string,
	name: string
): React.ComponentType<BaseProps> {
	return (
		(builderRegistry[namespace] && builderRegistry[namespace][name]) ||
		getRuntimeLoader(namespace, name)
	)
}

function getRuntimeLoader(
	namespace: string,
	name: string
): React.ComponentType<BaseProps> {
	return registry[namespace] && registry[namespace][name]
}

function getLoader(
	namespace: string,
	name: string,
	buildMode: boolean
): React.ComponentType<BaseProps> | null {
	return buildMode
		? getBuildtimeLoader(namespace, name)
		: getRuntimeLoader(namespace, name)
}

function get(
	namespace: string,
	name: string
): React.ComponentType<BasePropsPlus> {
	const loader = getLoader(namespace, name, false)
	return loader || NotFound
}

function getPropertiesDefinition(
	namespace: string,
	name: string
): BuildPropertiesDefinition | null {
	const propDef =
		definitionRegistry[namespace] && definitionRegistry[namespace][name]
	if (propDef) {
		propDef.name = name
		propDef.namespace = namespace
	}
	return propDef
}

function getPropertiesDefinitionFromPath(
	path: string
): BuildPropertiesDefinition | null {
	const pathArray = toPath(path)
	if (pathArray[0] === "wires") {
		return getPropertiesDefinition("uesio", "wire")
	}
	const componentFullName = getPathSuffix(pathArray)
	if (componentFullName) {
		const [namespace, name] = parseKey(componentFullName)
		return getPropertiesDefinition(namespace, name)
	}
	return null
}

function getBuilderNamespaces(): string[] {
	return Object.keys(builderRegistry)
}

function getBuilderComponents(namespace: string): string[] {
	return Object.keys(builderRegistry[namespace])
}

export {
	register,
	registerBuilder,
	get,
	getLoader,
	getPropertiesDefinition,
	getPropertiesDefinitionFromPath,
	getBuilderNamespaces,
	getBuilderComponents,
}
