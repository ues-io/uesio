import React, { FunctionComponent } from "react"
import {
	DefinitionMap,
	BaseProps,
	UtilityProps,
} from "../definition/definition"
import { Context, ContextFrame } from "../context/context"
import { getLoader, getUtilityLoader } from "./registry"
import NotFound from "../components/notfound"
import { mergeDefinitionMaps } from "../yamlutils/yamlutils"

type DisplayCondition = {
	field: string
	value: string
}

function shouldDisplayCondition(condition: DisplayCondition, context: Context) {
	const record = context.getRecord()
	const value = record?.getFieldValue(condition.field)
	return value === condition.value
}

function shouldDisplay(context: Context, definition?: DefinitionMap) {
	const displayLogic = definition?.["uesio.display"] as DisplayCondition[]
	if (displayLogic && displayLogic.length) {
		for (const condition of displayLogic) {
			if (!shouldDisplayCondition(condition, context)) {
				return false
			}
		}
	}
	return true
}

function additionalContext(context: Context, definition?: DefinitionMap) {
	const additionalContext = definition?.["uesio.context"] as ContextFrame
	if (additionalContext) {
		const workspace = additionalContext.workspace
		if (workspace) {
			return context.addFrame({
				workspace: {
					name: context.merge(workspace.name),
					app: context.merge(workspace.app),
				},
			})
		}
	}
	return context
}

const Component: FunctionComponent<BaseProps> = (props) => {
	const { componentType, path } = props
	return <ComponentInternal {...props} path={`${path}["${componentType}"]`} />
}

function mergeInVariants(
	definition: DefinitionMap,
	componentType: string,
	context: Context
): DefinitionMap {
	if (!definition["uesio.variant"]) {
		return definition
	}
	const variant = context.getComponentVariant(
		componentType,
		definition["uesio.variant"] as string
	)
	if (!variant) {
		return definition
	}
	return mergeDefinitionMaps(variant.definition, definition)
}

function render(
	loader: FunctionComponent<BaseProps>,
	componentType: string,
	props: BaseProps
) {
	const { context, definition } = props
	if (!shouldDisplay(context, definition)) return null
	const mergedDefinition =
		definition && mergeInVariants(definition, componentType, context)
	const Loader = loader
	return (
		<Loader
			{...{ ...props, definition: mergedDefinition }}
			context={additionalContext(context, mergedDefinition)}
		/>
	)
}

const ComponentInternal: FunctionComponent<BaseProps> = (props) => {
	const { componentType, context } = props
	if (!componentType) return <NotFound {...props} />
	const loader =
		getLoader(componentType, !!context.getBuildMode()) || NotFound
	return render(loader, componentType, props)
}

const renderUtility = (key: string) => (props: UtilityProps) => {
	const loader = getUtilityLoader(key) || NotFound
	return render(loader, key, props)
}

export { ComponentInternal, renderUtility, Component, render }
