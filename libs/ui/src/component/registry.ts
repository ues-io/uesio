import { FC } from "react"
import {
	BaseProps,
	UtilityProps,
	UtilityPropsPlus,
} from "../definition/definition"
import { BuildPropertiesDefinition } from "../buildmode/buildpropdefinition"
import {
	parseKey,
	getFullPathParts,
	parseFieldKey,
	parseVariantKey,
	getKeyAtPath,
	fromPath,
} from "./path"
import toPath from "lodash/toPath"
import { ComponentSignalDescriptor } from "../definition/signal"
import {
	getComponentTypePropsDef,
	getFieldPropsDef,
	getWirePropsDef,
	getPanelPropsDef,
	getParamPropsDef,
} from "./builtinpropsdefs"
import { MetadataKey } from "../bands/builder/types"

type Registry<T> = Record<string, T>
const registry: Registry<FC<BaseProps>> = {}
const utilityRegistry: Registry<FC<UtilityPropsPlus>> = {}
const builderRegistry: Registry<FC<BaseProps>> = {}
const definitionRegistry: Registry<BuildPropertiesDefinition> = {}
const componentSignalsRegistry: Registry<Registry<ComponentSignalDescriptor>> =
	{}

const addToRegistry = <T>(registry: Registry<T>, key: string, item: T) => {
	registry[key] = item
}

const register = (
	key: MetadataKey,
	componentType: FC<BaseProps>,
	signals?: Registry<ComponentSignalDescriptor>
) => {
	addToRegistry<FC<BaseProps>>(registry, key, componentType)
	signals && registerSignals(key, signals)
}

const registerSignals = (
	key: MetadataKey,
	signals: Registry<ComponentSignalDescriptor>
) => {
	addToRegistry(componentSignalsRegistry, key, signals)
}

const registerUtilityComponent = (
	key: MetadataKey,
	componentType: FC<UtilityProps>
) => {
	addToRegistry(utilityRegistry, key, componentType)
}

const registerBuilder = (
	key: MetadataKey,
	componentType?: FC<BaseProps>,
	definition?: BuildPropertiesDefinition
) => {
	componentType && addToRegistry(builderRegistry, key, componentType)
	definition && addToRegistry(definitionRegistry, key, definition)
}

const getBuildtimeLoader = (key: MetadataKey) => builderRegistry[key]

const getRuntimeLoader = (key: MetadataKey) => registry[key]

const getUtilityLoader = (key: MetadataKey) => utilityRegistry[key]

const getSignal = (key: string, signal: string) =>
	componentSignalsRegistry[key]?.[signal]

const getPropertiesDefinition = (
	key: MetadataKey
): BuildPropertiesDefinition => {
	const propDef = definitionRegistry[key]
	const [namespace, name] = parseKey(key)
	return {
		...propDef,
		name,
		namespace,
	}
}

// Trims any path to the last element that is fully namespaced
// (meaning the path element contains a dot)
const specialProps = ["uesio.variant", "uesio.display", "uesio.styles"]
const trimPath = (pathArray: string[]): string[] => {
	const size = pathArray.length
	if (size === 0) {
		return pathArray
	}
	const nextItem = pathArray[size - 1]
	if (nextItem.includes(".") && !specialProps.includes(nextItem)) {
		return pathArray
	}
	pathArray.pop()
	return trimPath(pathArray)
}

const getPropertiesDefinitionFromPath = (
	path: string
): [BuildPropertiesDefinition | undefined, string] => {
	const [metadataType, metadataItem, localPath] = getFullPathParts(path)
	if (metadataType === "component")
		return [getPropertiesDefinition(metadataItem), localPath]
	if (metadataType === "componentvariant") {
		const [namespace, name] = parseVariantKey(metadataItem)
		const propDef = getPropertiesDefinition(
			`${namespace}.${name}` as MetadataKey
		)
		propDef.type = "componentvariant"
		return [propDef, localPath]
	}
	if (metadataType === "componenttype") {
		return [
			getComponentTypePropsDef(getPropertiesDefinition(metadataItem)),
			localPath,
		]
	}
	if (metadataType === "field") {
		const [namespace, name, collectionNamespace, collectionName] =
			parseFieldKey(metadataItem)
		return [
			getFieldPropsDef(
				namespace,
				name,
				collectionNamespace,
				collectionName
			),
			localPath,
		]
	}
	if (metadataType === "viewdef") {
		const pathArray = toPath(localPath)
		if (pathArray[0] === "wires") {
			return [getWirePropsDef(), fromPath(pathArray.slice(0, 2))]
		}
		if (pathArray[0] === "panels" && pathArray.length === 2) {
			return [getPanelPropsDef(), fromPath(pathArray.slice(0, 2))]
		}
		if (pathArray[0] === "params") {
			return [getParamPropsDef(), fromPath(pathArray.slice(0, 2))]
		}

		const trimmedPath = trimPath(pathArray)
		const componentFullName = getKeyAtPath(fromPath(trimmedPath))
		if (componentFullName) {
			return [
				getPropertiesDefinition(componentFullName as MetadataKey),
				fromPath(trimmedPath),
			]
		}
	}

	return [undefined, localPath]
}
const getComponents = (trait: string) =>
	Object.keys(definitionRegistry).flatMap((fullName) => {
		const definition = getPropertiesDefinition(fullName as MetadataKey)
		return definition?.traits?.includes(trait) ? [definition] : []
	})

const getBuilderComponents = () => getComponents("uesio.standalone")

export {
	register,
	registerUtilityComponent,
	registerBuilder,
	registerSignals,
	getComponents,
	getBuildtimeLoader,
	getRuntimeLoader,
	getUtilityLoader,
	getSignal,
	getPropertiesDefinition,
	getPropertiesDefinitionFromPath,
	getBuilderComponents,
}
