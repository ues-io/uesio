import React, { ReactElement } from "react"
import { DefinitionMap, Definition } from "../definition/definition"
import { Context, ContextFrame } from "../context/context"
import { parseKey, getDefinitionKey } from "./path"
import { getLoader } from "./registry"

type DisplayCondition = {
	field: string
	value: string
}

function shouldDisplayCondition(
	condition: DisplayCondition,
	context: Context
): boolean {
	const record = context.getRecord()
	const value = record?.getFieldValue(condition.field)
	if (value === condition.value) {
		return true
	}
	return false
}

function shouldDisplay(
	componentData: DefinitionMap,
	context: Context
): boolean {
	const displayLogic = componentData?.["uesio.display"] as DisplayCondition[]
	if (displayLogic && displayLogic.length) {
		for (const condition of displayLogic) {
			if (!shouldDisplayCondition(condition, context)) {
				return false
			}
		}
	}
	return true
}

function additionalContext(
	componentData: DefinitionMap,
	context: Context
): Context {
	const additionalContext = componentData?.["uesio.context"] as ContextFrame
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

function create(
	definition: DefinitionMap,
	index: number,
	path: string,
	context: Context
): ReactElement | null {
	if (!definition) {
		console.log("Failed to Create Component: No Definition Provided")
		return null
	}
	const componentFullName = getDefinitionKey(definition)
	const [namespace, name] = parseKey(componentFullName)

	const componentData = definition[componentFullName] as DefinitionMap
	const newPath = `${path}["${componentFullName}"]`

	if (!shouldDisplay(componentData, context)) {
		return null
	}

	return createComponent(
		namespace,
		name,
		componentData,
		index,
		newPath,
		additionalContext(componentData, context)
	)
}

function createComponent(
	namespace: string,
	name: string,
	componentData: Definition,
	index: number,
	path: string,
	context: Context
): ReactElement | null {
	const Loader = getLoader(namespace, name, !!context.getBuildMode())
	if (!Loader) {
		// eslint-disable-next-line no-console
		console.log(
			`Failed to Create Component: No Loader Found for ${namespace}.${name}`
		)
		return null
	}
	return (
		<Loader
			{...{
				key: index,
				componentType: `${namespace}.${name}`,
				definition: componentData,
				index,
				path,
				context,
			}}
		></Loader>
	)
}

export { create, createComponent }
