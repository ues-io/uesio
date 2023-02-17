import Slot from "./slot"
import { useViewDef } from "../bands/viewdef"
import { makeViewId } from "../bands/view"
import { component as componentApi } from "../api/api"
import { useLoadWires } from "../bands/view/operations/load"
import {
	ComponentSignalDescriptor,
	SignalDefinition,
} from "../definition/signal"
import { BaseDefinition, UC } from "../definition/definition"

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

type ViewDefinition = {
	view: string
	params?: Record<string, string>
} & BaseDefinition

const View: UC<ViewDefinition> = (props) => {
	const { path, context, definition } = props
	const { params, view: viewDefId } = definition
	// Backwards compatibility for definition.id
	// TODO: Remove when all instances of this are fixed
	const uesioId = definition["uesio.id"] || definition.id || path || "$root"
	const viewId = makeViewId(viewDefId, uesioId)

	const isSubView = !!path

	const viewDef = useViewDef(viewDefId)
	const [paramState] = componentApi.useState<Record<string, string>>(
		componentApi.getComponentId(uesioId, "uesio/core.view", path, context),
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
			listName="components"
			path=""
			context={viewContext}
			message="Drag and drop any component here to get started."
		/>
	)
}

View.signals = signals

/*
const ViewPropertyDefinition: BuildPropertiesDefinition = {
	title: "View",
	description:
		"A collection of wires, components and panels that represent a user interface.",
	link: "https://docs.ues.io/",
	defaultDefinition: () => ({
		view: "",
	}),
	properties: [
		{
			name: "view",
			type: "METADATA",
			metadataType: "VIEW",
			label: "View",
		},
		{
			name: "params",
			type: "PARAMS",
			label: "Params",
		},
	],
	sections: [],
	traits: ["uesio.standalone"],
	classes: ["root"],
	type: "component",
	category: "LAYOUT",
}
*/

View.displayName = "View"

export default View
