import { definition, wire } from "@uesio/ui"
import { useSelectedPath } from "../../../../api/stateapi"

import PropertiesForm from "../../../../helpers/propertiesform"
import { ComponentProperty } from "../../../../properties/componentproperty"
import { useDefinition } from "../../../../api/defapi"

const WireProperties: definition.UtilityComponent = (props) => {
	const { context } = props

	const selectedPath = useSelectedPath(context)

	const wirePath = selectedPath.trimToSize(2)
	const [wireName] = wirePath.pop()

	// This forces a rerender if the definition changes
	useDefinition(wirePath) as wire.WireDefinition

	const properties: ComponentProperty[] = [
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
	]

	return (
		<PropertiesForm
			title={wireName || ""}
			context={context}
			id="wireproperties"
			properties={properties}
			sections={[
				{
					id: "uesio.home",
					label: "",
					icon: "home",
					type: "HOME",
				},
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
					viewDefinition: [
						{
							"uesio/builder.orderproperties": {},
						},
					],
				},
			]}
			path={wirePath}
		/>
	)
}

WireProperties.displayName = "WireProperties"

export default WireProperties
