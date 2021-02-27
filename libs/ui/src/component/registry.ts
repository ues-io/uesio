import { FC, ComponentType } from "react"
import { BaseProps, UtilityProps } from "../definition/definition"
import { BuildPropertiesDefinition } from "../buildmode/buildpropdefinition"
import { parseKey, getPathSuffix } from "./path"
import toPath from "lodash.topath"
import NotFound from "../components/notfound"
import { ComponentSignalDescriptor } from "../definition/signal"
import { renderUtility } from "./component"

type Registry<T> = Record<string, T>
const registry: Registry<Registry<FC<BaseProps>>> = {}
const utilityRegistry: Registry<Registry<FC<UtilityProps>>> = {}
const builderRegistry: Registry<Registry<FC<BaseProps>>> = {}
const definitionRegistry: Registry<Registry<BuildPropertiesDefinition>> = {}
const componentSignalsRegistry: Registry<Registry<
	Registry<ComponentSignalDescriptor>
>> = {}

const addToRegistry = <T>(
	registry: Registry<Registry<T>>,
	namespace: string,
	name: string,
	item: T
) => {
	if (!registry[namespace]) {
		registry[namespace] = {}
	}
	registry[namespace][name] = item
}

const register = (
	namespace: string,
	name: string,
	componentType: FC<BaseProps>,
	signals?: Registry<ComponentSignalDescriptor>
) => {
	addToRegistry<FC<BaseProps>>(registry, namespace, name, componentType)
	signals && addToRegistry(componentSignalsRegistry, namespace, name, signals)
}

const registerUtilityComponent = (
	namespace: string,
	name: string,
	componentType: FC<UtilityProps>
) => {
	addToRegistry(utilityRegistry, namespace, name, componentType)
}

const registerBuilder = (
	namespace: string,
	name: string,
	componentType: FC<BaseProps>,
	definition?: BuildPropertiesDefinition
) => {
	addToRegistry(builderRegistry, namespace, name, componentType)
	definition && addToRegistry(definitionRegistry, namespace, name, definition)
}

const getBuildtimeLoader = (namespace: string, name: string) =>
	builderRegistry[namespace]?.[name] || getRuntimeLoader(namespace, name)

const getRuntimeLoader = (namespace: string, name: string) =>
	registry[namespace]?.[name]

const getUtilityLoader = (namespace: string, name: string) =>
	utilityRegistry[namespace]?.[name]

const getLoader = (namespace: string, name: string, buildMode: boolean) =>
	buildMode
		? getBuildtimeLoader(namespace, name)
		: getRuntimeLoader(namespace, name)

const get = (namespace: string, name: string): ComponentType<BaseProps> =>
	getRuntimeLoader(namespace, name) || NotFound

const getUtility = (
	namespace: string,
	name: string
): ComponentType<UtilityProps> => renderUtility(namespace, name)

const getSignal = (namespace: string, name: string, signal: string) =>
	componentSignalsRegistry[namespace]?.[name]?.[signal]

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
	registerUtilityComponent,
	registerBuilder,
	get,
	getUtility,
	getLoader,
	getUtilityLoader,
	getSignal,
	getPropertiesDefinition,
	getPropertiesDefinitionFromPath,
	getBuilderNamespaces,
	getBuilderComponents,
}
