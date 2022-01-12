import { FC } from "react"
import {
	BaseProps,
	DefinitionMap,
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
import NotFound from "../components/notfound"
import { ComponentSignalDescriptor } from "../definition/signal"
import {
	getDefinitionFromVariant,
	mergeDefinitionMaps,
	renderUtility,
} from "./component"
import {
	getComponentTypePropsDef,
	getFieldPropsDef,
	getWirePropsDef,
	getPanelPropsDef,
	getParamPropsDef,
} from "./builtinpropsdefs"
import { Context } from "../context/context"

type Registry<T> = Record<string, T>
const registry: Registry<FC<BaseProps>> = {}
const utilityRegistry: Registry<FC<UtilityPropsPlus>> = {}
const builderRegistry: Registry<FC<BaseProps>> = {}
const definitionRegistry: Registry<BuildPropertiesDefinition> = {}
const componentSignalsRegistry: Registry<Registry<ComponentSignalDescriptor>> =
	{}

const addToRegistry = <T extends unknown>(
	registry: Registry<T>,
	key: string,
	item: T
) => {
	registry[key] = item
}

const register = (
	key: string,
	componentType: FC<BaseProps>,
	signals?: Registry<ComponentSignalDescriptor>
) => {
	addToRegistry<FC<BaseProps>>(registry, key, componentType)
	signals && registerSignals(key, signals)
}

const registerSignals = (
	key: string,
	signals: Registry<ComponentSignalDescriptor>
) => {
	addToRegistry(componentSignalsRegistry, key, signals)
}

const registerUtilityComponent = (
	key: string,
	componentType: FC<UtilityProps>
) => {
	addToRegistry(utilityRegistry, key, componentType)
}

const registerBuilder = (
	key: string,
	componentType?: FC<BaseProps>,
	definition?: BuildPropertiesDefinition
) => {
	componentType && addToRegistry(builderRegistry, key, componentType)
	definition && addToRegistry(definitionRegistry, key, definition)
}

const getBuildtimeLoader = (key: string) =>
	builderRegistry[key] || getDefaultBuildtimeLoader(key)

const getRuntimeLoader = (key: string) => registry[key]

const getUtilityLoader = (key: string) => utilityRegistry[key]

const getLoader = (key: string, buildMode: boolean) =>
	buildMode ? getBuildtimeLoader(key) : getRuntimeLoader(key)

const getVariantInfo = (
	fullName: string | undefined,
	key: string
): [string, string] => {
	const parts = fullName?.split(".")
	if (parts?.length === 4) {
		return [`${parts[0]}.${parts[1]}`, `${parts[2]}.${parts[3]}`]
	}
	if (parts?.length === 2) {
		return [key, `${parts[0]}.${parts[1]}`]
	}
	const [keyNamespace] = parseKey(key)
	return [key, `${keyNamespace}.default`]
}

function getVariantStylesDef(
	componentType: string,
	variantName: string,
	context: Context
) {
	const variant = context.getComponentVariant(componentType, variantName)
	if (!variant) return {}
	const variantDefinition = getDefinitionFromVariant(variant, context)
	return variantDefinition?.["uesio.styles"] as DefinitionMap
}

const getVariantStyleInfo = (props: UtilityProps, key: string) => {
	const { variant, context, styles } = props
	const [componentType, variantName] = getVariantInfo(variant, key)
	if (!variantName) {
		return styles as DefinitionMap
	}

	const variantStyles = getVariantStylesDef(
		componentType,
		variantName,
		context
	)

	const mergedVariantStyles = mergeDefinitionMaps({}, variantStyles, context)

	if (!styles) {
		return mergedVariantStyles
	}

	return mergeDefinitionMaps(
		mergedVariantStyles,
		styles as DefinitionMap,
		context
	)
}

const getUtility =
	<T extends UtilityProps = UtilityPropsPlus>(key: string) =>
	(props: T) => {
		const loader = getUtilityLoader(key) || NotFound
		const styles = getVariantStyleInfo(props, key)
		return renderUtility(loader, {
			...(props as unknown as UtilityPropsPlus),
			styles,
			componentType: key,
		})
	}

const BuildWrapper = getUtility("studio.buildwrapper")

const getDefaultBuildtimeLoader = (key: string) => (props: BaseProps) => {
	const Loader = getRuntimeLoader(key)

	// Don't use the buildwrapper for a panel component
	if (props.definition && "uesio.type" in props.definition)
		return <Loader {...props} />

	return Loader ? (
		<BuildWrapper {...props}>
			<Loader {...props} />
		</BuildWrapper>
	) : (
		<NotFound {...props} />
	)
}

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
		const propDef = getPropertiesDefinition(`${namespace}.${name}`)
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
				getPropertiesDefinition(componentFullName),
				fromPath(trimmedPath),
			]
		}
	}

	return [undefined, localPath]
}
const getComponents = (trait: string) =>
	Object.keys(definitionRegistry).reduce((acc, fullName) => {
		const [namespace, name] = parseKey(fullName)
		const definition = getPropertiesDefinition(`${namespace}.${name}`)
		if (definition?.traits?.includes(trait)) {
			if (!acc[namespace]) {
				acc[namespace] = {}
			}
			acc[namespace][name] = definition
		}
		return acc
	}, {} as Registry<Registry<BuildPropertiesDefinition>>)

const getBuilderComponents = () => getComponents("uesio.standalone")

export {
	register,
	registerUtilityComponent,
	registerBuilder,
	registerSignals,
	getUtility,
	getLoader,
	getComponents,
	getRuntimeLoader,
	getUtilityLoader,
	getSignal,
	getPropertiesDefinition,
	getPropertiesDefinitionFromPath,
	getBuilderComponents,
}
