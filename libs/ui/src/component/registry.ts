import { FC, ComponentType } from "react"
import { BaseProps, UtilityProps } from "../definition/definition"
import { BuildPropertiesDefinition } from "../buildmode/buildpropdefinition"
import { parseKey, getPathSuffix } from "./path"
import toPath from "lodash.topath"
import NotFound from "../components/notfound"
import { ComponentSignalDescriptor } from "../definition/signal"
import { renderUtility } from "./component"

type Registry<T> = Record<string, T>
const registry: Registry<FC<BaseProps>> = {}
const utilityRegistry: Registry<FC<UtilityProps>> = {}
const builderRegistry: Registry<FC<BaseProps>> = {}
const definitionRegistry: Registry<BuildPropertiesDefinition> = {}
const componentSignalsRegistry: Registry<Registry<
	ComponentSignalDescriptor
>> = {}

const addToRegistry = <T>(registry: Registry<T>, key: string, item: T) => {
	registry[key] = item
}

const register = (
	key: string,
	componentType: FC<BaseProps>,
	signals?: Registry<ComponentSignalDescriptor>
) => {
	addToRegistry<FC<BaseProps>>(registry, key, componentType)
	signals && addToRegistry(componentSignalsRegistry, key, signals)
}

const registerUtilityComponent = (
	key: string,
	componentType: FC<UtilityProps>
) => {
	addToRegistry(utilityRegistry, key, componentType)
}

const registerBuilder = (
	key: string,
	componentType: FC<BaseProps>,
	definition?: BuildPropertiesDefinition
) => {
	addToRegistry(builderRegistry, key, componentType)
	definition && addToRegistry(definitionRegistry, key, definition)
}

const getBuildtimeLoader = (key: string) =>
	builderRegistry[key] || getRuntimeLoader(key)

const getRuntimeLoader = (key: string) => registry[key]

const getUtilityLoader = (key: string) => utilityRegistry[key]

const getLoader = (key: string, buildMode: boolean) =>
	buildMode ? getBuildtimeLoader(key) : getRuntimeLoader(key)

const get = (key: string): ComponentType<BaseProps> =>
	getRuntimeLoader(key) || NotFound

const getUtility = (key: string): ComponentType<UtilityProps> =>
	renderUtility(key)

const getSignal = (key: string, signal: string) =>
	componentSignalsRegistry[key]?.[signal]

const getPropertiesDefinition = (key: string) => {
	const propDef = definitionRegistry[key]
	if (propDef) {
		const [namespace, name] = parseKey(key)
		propDef.name = name
		propDef.namespace = namespace
	}
	return propDef
}

const getPropertiesDefinitionFromPath = (path: string) => {
	const pathArray = toPath(path)
	if (pathArray[0] === "wires") {
		return getPropertiesDefinition("uesio.wire")
	}
	const componentFullName = getPathSuffix(pathArray)
	if (componentFullName) {
		return getPropertiesDefinition(componentFullName)
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
