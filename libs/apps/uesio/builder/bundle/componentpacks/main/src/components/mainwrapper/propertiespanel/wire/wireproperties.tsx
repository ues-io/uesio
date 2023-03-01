import { definition, wire } from "@uesio/ui"
import { useSelectedPath } from "../../../../api/stateapi"

import PropertiesForm from "../../../../helpers/propertiesform"
import { ComponentProperty } from "../../../../properties/componentproperty"
import { useDefinition } from "../../../../api/defapi"
import { getHomeSection } from "../../../../api/propertysection"

const WireProperties: definition.UtilityComponent = (props) => {
	const { context } = props

	const selectedPath = useSelectedPath(context)

	const wirePath = selectedPath.trimToSize(2)
	const [wireName] = wirePath.pop()

	// This forces a rerender if the definition changes
	useDefinition(wirePath) as wire.WireDefinition

	const properties: ComponentProperty[] = [
		// Wire Home properties
		{
			name: "wirename",
			label: "Wire Name",
			required: true,
			type: "KEY",
		},
		{
			name: "collection",
			label: "Collection",
			required: true,
			type: "METADATA",
			metadataType: "COLLECTION",
		},
		{
			name: "batchsize",
			label: "Batch Size",
			type: "NUMBER",
		},
		// Order section properties
		{
			name: "order",
			type: "LIST",
			items: {
				title: "Order By",
				addLabel: "New Ordering",
				displayTemplate: (order: { desc: boolean; field: string }) => {
					if (order.field) {
						return `${order.field} | ${
							order.desc ? "Descending" : "Ascending"
						}`
					}
					return "NEW_VALUE"
				},
				defaultDefinition: { desc: false },
				properties: [
					{
						name: "field",
						type: "METADATA",
						metadataType: "FIELD",
						label: "Field",
						groupingPath: "../collection",
					},
					{
						name: "desc",
						type: "CHECKBOX",
						label: "Descending",
					},
				],
			},
		},
	]

	return (
		<PropertiesForm
			title={wireName || ""}
			context={context}
			id="wireproperties"
			properties={properties}
			sections={[
				getHomeSection(["wirename", "collection", "batchsize"]),
				{
					id: "fields",
					label: "Fields",
					type: "CUSTOM",
					viewDefinition: [
						{
							"uesio/builder.fieldsproperties": {},
						},
					],
				},
				{
					id: "conditions",
					label: "Conditions",
					type: "CUSTOM",
					viewDefinition: [
						{
							"uesio/builder.conditionsproperties": {},
						},
					],
				},
				{
					id: "order",
					label: "Order",
					type: "CUSTOM",
					properties: ["order"],
				},
			]}
			path={wirePath}
		/>
	)
}

WireProperties.displayName = "WireProperties"

export default WireProperties
