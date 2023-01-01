import Slot from "../slot"
import { useViewDef } from "../../bands/viewdef"
import { ViewProps } from "./viewdefinition"
import { makeViewId } from "../../bands/view"
import { useUesio } from "../../hooks/hooks"
import { useLoadWires } from "../../bands/view/operations/load"
import {
	ComponentSignalDescriptor,
	SignalDefinition,
} from "../../definition/signal"
import { UesioComponent } from "../../definition/definition"

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
		label: "Set Param",
		properties: () => [],
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
		label: "Set Params",
		properties: () => [],
	},
}

const View: UesioComponent<ViewProps> = (props) => {
	const {
		path,
		context,
		definition: { params, view: viewDefId, id },
	} = props

	const uesio = useUesio(props)

	const viewId = makeViewId(viewDefId, path ? id || path : "$root")

	const isSubView = !!path

	const viewDef = useViewDef(viewDefId)

	const [paramState] = uesio.component.useState<Record<string, string>>(
		uesio.component.getComponentId(id, "uesio/core.view", path, context),
		context.mergeStringMap(params)
	)

	const viewContext = context.addFrame({
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
			listName="components"
			path=""
			accepts={["uesio.standalone"]}
			context={viewContext}
			message="Drag and drop any component here to get started."
		/>
	)
}

View.signals = signals

export default View
