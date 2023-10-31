import { definition, api, wire } from "@uesio/ui"

import PropertiesForm from "../../../helpers/propertiesform"
import { FullPath } from "../../../api/path"
import { ComponentProperty } from "../../../properties/componentproperty"
import { getComponentDef } from "../../../api/stateapi"
import { set } from "../../../api/defapi"

const defaultPanelComponentType = "uesio/io.dialog"

const SimpleTagContent = [
	{
		"uesio/io.text": {
			"uesio.styleTokens": {
				root: ["m-2"],
			},
			element: "div",
			text: "${key}",
		},
	},
]

const ViewInfoPanel: definition.UtilityComponent = (props) => {
	const { context } = props

	const viewDefId = context.getViewDefId() || ""
	const viewDef = api.view.useViewDef(viewDefId)
	if (!viewDefId || !viewDef) return null
	const path = new FullPath("viewdef", viewDefId)
	const addWireWithDefaultDefinition = (def: wire.WireDefinition) =>
		set(
			context,
			path
				.addLocal("wires")
				.addLocal(`wire${Math.floor(Math.random() * 60) + 1}`),
			def,
			true
		)

	const properties: ComponentProperty[] = [
		{
			name: "wires",
			content: [
				{
					"uesio/builder.wiretag": {},
				},
			],
			defaultKey: "wire",
			type: "MAP",
			actions: [
				{
					label: "Collection Wire",
					action: () => {
						addWireWithDefaultDefinition({
							fields: {},
							collection: "",
							batchsize: 200,
							init: {
								query: true,
								create: false,
							},
						})
					},
				},
				{
					label: "View-only Wire",
					action: () =>
						addWireWithDefaultDefinition({
							viewOnly: true,
							fields: {},
							init: {
								query: false,
								create: true,
							},
						}),
				},
			],
		},
		{
			name: "panels",
			content: SimpleTagContent,
			defaultDefinition: {
				"uesio.type": defaultPanelComponentType,
				components: [],
				...getComponentDef(defaultPanelComponentType)
					?.defaultDefinition,
			},
			defaultKey: "panel",
			type: "MAP",
		},
		{
			name: "params",
			content: SimpleTagContent,
			defaultDefinition: {
				type: "RECORD",
				required: true,
			},
			defaultKey: "param",
			type: "MAP",
		},
	]

	return (
		<PropertiesForm
			id="propertiespanel"
			context={context}
			properties={properties}
			sections={[
				{
					id: "components",
					label: "Components",
					type: "CUSTOM",
					viewDefinition: [{ "uesio/builder.componentspanel": {} }],
				},
				{
					id: "wires",
					label: "Wires",
					type: "CUSTOM",
					properties: ["wires"],
				},
				{
					id: "panels",
					label: "Panels",
					type: "CUSTOM",
					properties: ["panels"],
				},
				{
					id: "params",
					label: "Params",
					type: "CUSTOM",
					properties: ["params"],
				},
			]}
			path={path}
		/>
	)
}

export default ViewInfoPanel
