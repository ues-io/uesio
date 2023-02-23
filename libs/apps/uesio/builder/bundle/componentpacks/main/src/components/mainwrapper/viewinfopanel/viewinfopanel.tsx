import { definition, api } from "@uesio/ui"

import PropertiesForm, {
	getFormFieldFromProperty,
} from "../../../helpers/propertiesform"
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

	const wireProperty: ComponentProperty = {
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
	}

	const panelsProperty: ComponentProperty = {
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
	}

	const paramsProperty: ComponentProperty = {
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
	}

	return (
		<div className={props.className}>
			<PropertiesForm
				id="propertiespanel"
				context={context}
				properties={[wireProperty, panelsProperty, paramsProperty]}
				content={[
					{
						"uesio/io.tabs": {
							labelsVariant: "uesio/builder.mainsection",
							panelVariant: "uesio/builder.mainsection",
							tabs: [
								{
									id: "components",
									label: "Components",
									components: [
										{
											"uesio/builder.componentspanel": {},
										},
									],
								},
								{
									id: "wires",
									label: "Wires",
									components: [
										getFormFieldFromProperty(
											wireProperty,
											context,
											path
										),
									],
								},
								{
									id: "panels",
									label: "Panels",
									components: [
										getFormFieldFromProperty(
											panelsProperty,
											context,
											path
										),
									],
								},
								{
									id: "params",
									label: "Params",
									components: [
										getFormFieldFromProperty(
											paramsProperty,
											context,
											path
										),
									],
								},
							],
						},
					},
				]}
				path={path}
			/>
		</div>
	)
}

export default ViewInfoPanel
