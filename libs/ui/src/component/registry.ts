import { BaseProps, BasePropsPlus } from "../definition/definition"
import { BuildPropertiesDefinition } from "../buildmode/buildpropdefinition"
import { parseKey, getPathSuffix } from "./path"
import toPath from "lodash.topath"
import NotFound from "../components/notfound"

type ComponentNamespaceRegistry = {
	[key: string]: ComponentRegistry
}

type ComponentRegistry = {
	[key: string]: React.FunctionComponent<BaseProps> | undefined
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

const addToRegistry = (
	registry: ComponentNamespaceRegistry | DefinitionNamespaceRegistry,
	namespace: string,
	name: string,
	componentType:
		| React.FunctionComponent<BaseProps>
		| BuildPropertiesDefinition
) => {
	if (!registry[namespace]) {
		registry[namespace] = {}
	}
	registry[namespace][name] = componentType
}

const register = (
	namespace: string,
	name: string,
	componentType: React.FunctionComponent<BaseProps>
) => {
	addToRegistry(registry, namespace, name, componentType)
}

const registerBuilder = (
	namespace: string,
	name: string,
	componentType: React.FunctionComponent<BaseProps>,
	definition: BuildPropertiesDefinition | null
) => {
	addToRegistry(builderRegistry, namespace, name, componentType)
	definition && addToRegistry(definitionRegistry, namespace, name, definition)
}

const getBuildtimeLoader = (namespace: string, name: string) =>
	builderRegistry[namespace]?.[name] || getRuntimeLoader(namespace, name)

const getRuntimeLoader = (namespace: string, name: string) =>
	registry[namespace]?.[name]

const getLoader = (namespace: string, name: string, buildMode: boolean) =>
	buildMode
		? getBuildtimeLoader(namespace, name)
		: getRuntimeLoader(namespace, name)

const get = (
	namespace: string,
	name: string
): React.ComponentType<BasePropsPlus> =>
	getLoader(namespace, name, false) || NotFound

const getPropertiesDefinition = (namespace: string, name: string) => {
	const propDef = definitionRegistry[namespace]?.[name]
	if (propDef) {
		propDef.name = name
		propDef.namespace = namespace
	}
	return propDef
}

const getPropertiesDefinitionFromPath = (path: string) => {
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

const getBuilderNamespaces = () => Object.keys(builderRegistry)
const getBuilderComponents = (namespace: string) =>
	Object.keys(builderRegistry[namespace])

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
