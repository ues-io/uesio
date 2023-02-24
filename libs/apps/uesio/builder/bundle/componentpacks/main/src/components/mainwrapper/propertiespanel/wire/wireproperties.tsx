import { definition, wire } from "@uesio/ui"
import PropertiesWrapper from "../propertieswrapper"
import { setSelectedPath, useSelectedPath } from "../../../../api/stateapi"

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
		<PropertiesWrapper
			context={props.context}
			className={props.className}
			path={selectedPath}
			title={wireName || ""}
			onUnselect={() => setSelectedPath(context)}
		>
			<PropertiesForm
				context={context}
				id="wireproperties"
				properties={properties}
				content={[
					{
						"uesio/io.tabs": {
							labelsVariant: "uesio/builder.mainsection",
							panelVariant: "uesio/io.default",
							tabs: [
								{
									id: "",
									label: "",
									icon: "home",
									components: [
										{
											"uesio/builder.property": {
												propertyId: "wirename",
											},
										},
										{
											"uesio/builder.property": {
												propertyId: "collection",
											},
										},
										{
											"uesio/builder.property": {
												propertyId: "batchsize",
											},
										},
									],
								},
								{
									id: "fields",
									label: "Fields",
									components: [
										{
											"uesio/builder.fieldsproperties":
												{},
										},
									],
								},
								{
									id: "conditions",
									label: "Conditions",
									components: [
										{
											"uesio/builder.conditionsproperties":
												{},
										},
									],
								},
								{
									id: "order",
									label: "Order",
									components: [
										{
											"uesio/builder.orderproperties": {},
										},
									],
								},
							],
						},
					},
				]}
				path={wirePath}
			/>
		</PropertiesWrapper>
	)
}

WireProperties.displayName = "WireProperties"

export default WireProperties
