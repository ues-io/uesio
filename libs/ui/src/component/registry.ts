import { FunctionComponent, ComponentType } from "react"
import { BaseProps, BasePropsPlus } from "../definition/definition"
import { BuildPropertiesDefinition } from "../buildmode/buildpropdefinition"
import { parseKey, getPathSuffix } from "./path"
import toPath from "lodash.topath"
import NotFound from "../components/notfound"
import { ComponentSignalDescriptor } from "../definition/signal"

const registry: Record<
	string,
	Record<string, FunctionComponent<BaseProps>>
> = {}
const builderRegistry: Record<
	string,
	Record<string, FunctionComponent<BaseProps>>
> = {}
const definitionRegistry: Record<
	string,
	Record<string, BuildPropertiesDefinition>
> = {}
const componentSignalsRegistry: Record<
	string,
	Record<string, Record<string, ComponentSignalDescriptor>>
> = {}

const addToRegistry = <T>(
	registry: Record<string, Record<string, T>>,
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
	componentType: FunctionComponent<BaseProps>,
	signals?: Record<string, ComponentSignalDescriptor>
) => {
	addToRegistry<FunctionComponent<BaseProps>>(
		registry,
		namespace,
		name,
		componentType
	)
	signals && addToRegistry(componentSignalsRegistry, namespace, name, signals)
}

const registerBuilder = (
	namespace: string,
	name: string,
	componentType: FunctionComponent<BaseProps>,
	definition?: BuildPropertiesDefinition
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

const get = (namespace: string, name: string): ComponentType<BasePropsPlus> =>
	getLoader(namespace, name, false) || NotFound

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
	registerBuilder,
	get,
	getLoader,
	getSignal,
	getPropertiesDefinition,
	getPropertiesDefinitionFromPath,
	getBuilderNamespaces,
	getBuilderComponents,
}
