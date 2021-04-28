import { FC } from "react"
import {
	BaseDefinition,
	BaseProps,
	UtilityProps,
} from "../definition/definition"
import { BuildPropertiesDefinition } from "../buildmode/buildpropdefinition"
import { parseKey, getPathSuffix } from "./path"
import toPath from "lodash.topath"
import NotFound from "../components/notfound"
import { ComponentSignalDescriptor } from "../definition/signal"
import { mergeDefinitionMaps, render } from "./component"

type Registry<T> = Record<string, T>
const registry: Registry<FC<BaseProps>> = {}
const utilityRegistry: Registry<FC<UtilityProps>> = {}
const builderRegistry: Registry<FC<BaseProps>> = {}
const definitionRegistry: Registry<BuildPropertiesDefinition> = {}
const componentSignalsRegistry: Registry<
	Registry<ComponentSignalDescriptor>
> = {}

const addToRegistry = <T>(registry: Registry<T>, key: string, item: T) => {
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

const get = (key: string) => (props: BaseProps) => {
	const loader = getRuntimeLoader(key) || NotFound
	return render(loader, key, {
		...props,
		componentType: key,
		definition: props.definition,
	})
}
const getUtility = (key: string) => (props: UtilityProps) => {
	const loader = getUtilityLoader(key) || NotFound
	const definition = {
		...props.definition,
		...(props.styles && {
			"uesio.styles": props.definition?.["uesio.styles"]
				? mergeDefinitionMaps(
						props.styles,
						props.definition["uesio.styles"],
						undefined
				  )
				: props.styles,
		}),
		...(props.variant && { "uesio.variant": props.variant }),
	} as BaseDefinition
	return render(loader, key, { ...props, componentType: key, definition })
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

const getPropertiesDefinitionFromPath = (path: string) => {
	const pathArray = toPath(path)
	const componentFullName = getPathSuffix(pathArray)
	if (componentFullName) {
		return getPropertiesDefinition(componentFullName)
	}
	return undefined
}

const getBuilderComponents = () => Object.keys(builderRegistry)

export {
	register,
	registerUtilityComponent,
	registerBuilder,
	registerSignals,
	get,
	getUtility,
	getLoader,
	getUtilityLoader,
	getSignal,
	getPropertiesDefinition,
	getPropertiesDefinitionFromPath,
	getBuilderComponents,
}
