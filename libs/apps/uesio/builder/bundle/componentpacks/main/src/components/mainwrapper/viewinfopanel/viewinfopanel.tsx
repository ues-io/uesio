import { definition, api } from "@uesio/ui"

import PropertiesForm from "../../../helpers/propertiesform"
import { FullPath } from "../../../api/path"
import { ComponentProperty } from "../../../properties/componentproperty"
import { getComponentDef } from "../../../api/stateapi"

const defaultPanelComponentType = "uesio/io.dialog"

const ViewInfoPanel: definition.UtilityComponent = (props) => {
	const { context } = props

	const viewDefId = context.getViewDefId() || ""
	const viewDef = api.view.useViewDef(viewDefId)
	if (!viewDefId || !viewDef || !viewDef.wires) return null
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
			},
			defaultKey: "wire",
			type: "MAP",
		},
		{
			name: "panels",
			content: [
				{
					"uesio/io.text": {
						element: "div",
						text: "${key}",
					},
				},
			],
			defaultDefinition: {
				"uesio.type": defaultPanelComponentType,
				components: [],
				...getComponentDef(context, defaultPanelComponentType)
					?.defaultDefinition,
			},
			defaultKey: "panel",
			type: "MAP",
		},
		{
			name: "params",
			content: [
				{
					"uesio/io.text": {
						element: "div",
						text: "${key}",
					},
				},
			],
			defaultDefinition: {
				type: "RECORD",
				required: true,
			},
			defaultKey: "param",
			type: "MAP",
		},
	]

	return (
		<div className={props.className}>
			<PropertiesForm
				id="propertiespanel"
				context={context}
				properties={properties}
				sections={[
					{
						id: "components",
						label: "Components",
						type: "CUSTOM",
						viewDefinition: [
							{ "uesio/builder.componentspanel": {} },
						],
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
		</div>
	)
}

export default ViewInfoPanel
