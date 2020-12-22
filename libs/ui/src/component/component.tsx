import { FunctionComponent } from "react"
import { DefinitionMap, BaseProps } from "../definition/definition"
import { Context, ContextFrame } from "../context/context"
import { parseKey } from "./path"
import { getLoader } from "./registry"
import NotFound from "../components/notfound"

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

const ComponentInternal: FunctionComponent<BaseProps> = (props) => {
	const { componentType, context, definition } = props
	if (!componentType) return <NotFound {...props} />
	if (!shouldDisplay(context, definition)) return null

	const [namespace, name] = parseKey(componentType)
	const Loader =
		getLoader(namespace, name, !!context.getBuildMode()) || NotFound
	return (
		<Loader {...props} context={additionalContext(context, definition)} />
	)
}

export { ComponentInternal, Component }
