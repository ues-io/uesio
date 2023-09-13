import { definition, api } from "@uesio/ui"

import PropertiesForm from "../../../helpers/propertiesform"
import { FullPath } from "../../../api/path"
import { ComponentProperty } from "../../../properties/componentproperty"
import { getComponentDef } from "../../../api/stateapi"

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

	const properties: ComponentProperty[] = [
		{
			name: "wires",
			content: [
				{
					"uesio/builder.wiretag": {},
				},
			],
			defaultDefinition: {
				fields: null,
				batchsize: 200,
				init: {
					query: true,
					create: false,
				},
			},
			defaultKey: "wire",
			type: "MAP",
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
