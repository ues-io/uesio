import { FC } from "react"
import { UC, UtilityProps } from "../definition/definition"
import {
	ActionDescriptor,
	BuildPropertiesDefinition,
} from "../buildmode/buildpropdefinition"
import {
	parseKey,
	getFullPathParts,
	parseVariantKey,
	getKeyAtPath,
	fromPath,
} from "./path"
import toPath from "lodash/toPath"
import { ComponentSignalDescriptor } from "../definition/signal"
import { MetadataKey } from "../bands/builder/types"

type Registry<T> = Record<string, T>
const registry: Registry<UC> = {}
const utilityRegistry: Registry<FC<UtilityProps>> = {}
const componentSignalsRegistry: Registry<Registry<ComponentSignalDescriptor>> =
	{}

const addToRegistry = <T>(registry: Registry<T>, key: string, item: T) => {
	registry[key] = item
}

const registerSignals = (
	key: MetadataKey,
	signals: Registry<ComponentSignalDescriptor>
) => {
	addToRegistry(componentSignalsRegistry, key, signals)
}

const register = (key: MetadataKey, componentType: UC) => {
	addToRegistry<UC>(registry, key, componentType)
	componentType.signals && registerSignals(key, componentType.signals)
}

const registerUtilityComponent = (
	key: MetadataKey,
	componentType: FC<UtilityProps>
) => {
	addToRegistry(utilityRegistry, key, componentType)
}

const getRuntimeLoader = (key: MetadataKey) => registry[key]

const getUtilityLoader = (key: MetadataKey) => utilityRegistry[key]

const getSignal = (key: string, signal: string) =>
	componentSignalsRegistry[key]?.[signal]

const getPropertiesDefinition = (
	key: MetadataKey
): BuildPropertiesDefinition => {
	const [namespace, name] = parseKey(key)
	return {
		title: "blah",
		sections: [],
		defaultDefinition: () => ({}),
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

const standardActions: ActionDescriptor[] = [
	{ type: "DELETE" },
	{ type: "MOVE" },
	{ type: "CLONE" },
]

const getPropertiesDefinitionFromPath = (
	path: string
): [BuildPropertiesDefinition, string] => {
	const [metadataType, metadataItem, localPath] = getFullPathParts(path)
	if (metadataType === "component")
		return [getPropertiesDefinition(metadataItem), localPath]
	if (metadataType === "componentvariant") {
		const [namespace, name] = parseVariantKey(metadataItem)
		const propDef = getPropertiesDefinition(
			`${namespace}.${name}` as MetadataKey
		)
		return [
			{
				...propDef,
				title: "Component Variant",
				type: "componentvariant",
				sections: [],
				properties: [],
			},
			localPath,
		]
	}
	if (metadataType === "viewdef") {
		const pathArray = toPath(localPath)
		const trimmedPath = trimPath(pathArray)
		const trimmedPathString = fromPath(trimmedPath)
		const componentFullName = getKeyAtPath(trimmedPathString) as MetadataKey
		if (componentFullName) {
			const componentPropsDef = getPropertiesDefinition(componentFullName)
			return [
				{
					...componentPropsDef,
					sections: componentPropsDef.sections.concat([
						{
							title: "Styles",
							type: "STYLES",
						},
						{
							title: "Display",
							type: "CONDITIONALDISPLAY",
						},
					]),
					actions: standardActions.concat(
						...(componentPropsDef.actions || [])
					),
				},
				trimmedPathString,
			]
		}
	}

	return [
		{
			title: "Nothing Selected",
			defaultDefinition: () => ({}),
			sections: [],
		},
		localPath,
	]
}

export {
	register,
	registerUtilityComponent,
	getRuntimeLoader,
	getUtilityLoader,
	getSignal,
	getPropertiesDefinition,
	getPropertiesDefinitionFromPath,
}
