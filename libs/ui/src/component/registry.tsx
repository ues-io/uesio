import { FC } from "react"
import {
	BaseProps,
	DefinitionMap,
	UtilityProps,
} from "../definition/definition"
import { BuildPropertiesDefinition } from "../buildmode/buildpropdefinition"
import {
	parseKey,
	getPathSuffix,
	getFullPathParts,
	parseFieldKey,
} from "./path"
import toPath from "lodash/toPath"
import NotFound from "../components/notfound"
import { ComponentSignalDescriptor } from "../definition/signal"
import {
	getVariantStylesDef,
	mergeDefinitionMaps,
	renderUtility,
} from "./component"

type Registry<T> = Record<string, T>
const registry: Registry<FC<BaseProps>> = {}
const utilityRegistry: Registry<FC<UtilityProps>> = {}
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

const getUtility = (key: string) => (props: UtilityProps) => {
	const loader = getUtilityLoader(key) || NotFound
	const styles = getVariantStyleInfo(props, key)
	return renderUtility(loader, { ...props, styles, componentType: key })
}

const BuildWrapper = getUtility("studio.buildwrapper")

const getDefaultBuildtimeLoader = (key: string) => (props: BaseProps) => {
	const Loader = getRuntimeLoader(key)
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

const getPropertiesDefinitionFromPath = (
	path: string
): BuildPropertiesDefinition | undefined => {
	const [metadataType, metadataItem, localPath] = getFullPathParts(path)
	if (metadataType === "component")
		return getPropertiesDefinition(metadataItem)
	if (metadataType === "field") {
		const [namespace, name, collectionNamespace, collectionName] =
			parseFieldKey(metadataItem)
		return {
			title: name,
			sections: [],
			defaultDefinition: () => ({}),
			traits: [
				"uesio.field",
				"wire." + collectionNamespace + "." + collectionName,
			],
			namespace,
			name,
		}
	}
	if (metadataType === "viewdef") {
		const pathArray = toPath(localPath)
		if (pathArray[0] === "wires") {
			return {
				title: "Wire",
				defaultDefinition: () => ({}),
				properties: [
					{
						name: "name",
						type: "KEY",
						label: "Name",
					},
					{
						name: "collection",
						type: "METADATA",
						metadataType: "COLLECTION",
						label: "Collection",
					},
					{
						name: "type",
						type: "SELECT",
						label: "Wire Type",
						options: [
							{
								label: "Create",
								value: "CREATE",
							},
							{
								label: "Read",
								value: "",
							},
						],
					},
				],
				sections: [
					{
						title: "Fields",
						type: "FIELDS",
					},
					{
						title: "Conditions",
						type: "CONDITIONS",
					},
				],
				actions: [
					{
						type: "LOAD_WIRE",
						label: "Refresh Wire",
					},
				],
			}
		}
		const componentFullName = getPathSuffix(pathArray)
		if (componentFullName) {
			return getPropertiesDefinition(componentFullName)
		}
	}

	return undefined
}

const getBuilderComponents = () =>
	Object.keys(definitionRegistry).reduce((acc, fullName) => {
		const [namespace, name] = parseKey(fullName)
		if (!acc[namespace]) {
			acc[namespace] = {}
		}
		const definition = getPropertiesDefinition(`${namespace}.${name}`)
		if (definition?.traits?.includes("uesio.standalone")) {
			acc[namespace][name] = definition
		}
		return acc
	}, {} as Registry<Registry<BuildPropertiesDefinition>>)

export {
	register,
	registerUtilityComponent,
	registerBuilder,
	registerSignals,
	getUtility,
	getLoader,
	getRuntimeLoader,
	getUtilityLoader,
	getSignal,
	getPropertiesDefinition,
	getPropertiesDefinitionFromPath,
	getBuilderComponents,
}
