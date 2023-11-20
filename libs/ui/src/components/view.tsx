import Slot, { DefaultSlotName } from "../utilities/slot"
import { useViewDef } from "../bands/viewdef"
import { makeViewId } from "../bands/view"
import { component as componentApi } from "../api/api"
import { useLoadWires } from "../bands/view/operations/load"
import {
	ComponentSignalDescriptor,
	SignalDefinition,
} from "../definition/signal"
import { UC } from "../definition/definition"
import PanelArea from "../utilities/panelarea"
import { COMPONENT_ID } from "../componentexports"

interface SetParamSignal extends SignalDefinition {
	param: string
	value: string
}

interface SetParamsSignal extends SignalDefinition {
	params: Record<string, string>
}

const signals: Record<string, ComponentSignalDescriptor> = {
	SET_PARAM: {
		dispatcher: (
			state: Record<string, string>,
			signal: SetParamSignal,
			context
		) => {
			const value = context.mergeString(signal.value)
			state[signal.param] = value
		},
	},
	SET_PARAMS: {
		dispatcher: (
			state: Record<string, string>,
			signal: SetParamsSignal,
			context
		) => {
			const params = context.mergeStringMap(signal.params)
			Object.keys(params).forEach((key) => {
				state[key] = params[key]
			})
		},
	},
}

type ViewComponentDefinition = {
	view: string
	params?: Record<string, string>
}

const ViewArea: UC<ViewComponentDefinition> = ({
	context,
	definition,
	path,
}) => (
	<>
		<View context={context} definition={definition} path={path} />
		<PanelArea context={context} />
	</>
)

const ViewComponentId = "uesio/core.view"

const View: UC<ViewComponentDefinition> = (props) => {
	const { path, context, definition } = props
	const { params, view: viewDefId } = definition
	// Backwards compatibility for definition.id
	// TODO: Remove when all instances of this are fixed
	const uesioId = definition[COMPONENT_ID] || definition.id || path || "$root"
	const viewId = makeViewId(viewDefId, uesioId)

	const isSubView = !!path

	const viewDef = useViewDef(viewDefId)
	const [paramState] = componentApi.useState<Record<string, string>>(
		componentApi.getComponentId(uesioId, ViewComponentId, path, context),
		context.mergeStringMap(params)
	)

	const viewContext = context.addViewFrame({
		view: viewId,
		viewDef: viewDefId,
		params: paramState,
	})

	useLoadWires(viewContext, viewDef)

	if (!viewDef) return null

	if (isSubView && context.getViewStack()?.includes(viewDefId)) {
		throw new Error(
			`View ${viewDefId} cannot be selected in this context, please try another one.`
		)
	}

	return (
		<Slot
			definition={viewDef}
			listName={DefaultSlotName}
			path=""
			context={viewContext}
			label="View Components"
		/>
	)
}

View.signals = signals
View.displayName = "View"

export { ViewArea, ViewComponentId }
export type { ViewComponentDefinition }

export default View
