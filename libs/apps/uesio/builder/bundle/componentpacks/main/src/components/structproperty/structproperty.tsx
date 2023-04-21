import { definition, component, metadata } from "@uesio/ui"
import { FullPath } from "../../api/path"
import {
	ComponentProperty,
	StructProperty as SP,
} from "../../properties/componentproperty"
import { getFormFieldFromProperty } from "../property/property"

type Definition = {
	property: SP
	path: FullPath
}

const StructProperty: definition.UC<Definition> = (props) => {
	const { context, definition } = props

	const { property } = definition

	if (!component.useShould(property?.displayConditions, context)) return null

	const structProperties = property.properties as ComponentProperty[]
	const path = definition.path.combine()
	const FieldWrapper = component.getUtility("uesio/io.fieldwrapper")

	return (
		<FieldWrapper
			label={property.label || property.name}
			labelPosition="left"
			context={context}
			variant="uesio/io.minimal"
		>
			{structProperties.map((subProperty, index) => {
				const formField = getFormFieldFromProperty(
					subProperty,
					context,
					definition.path
				) as Record<string, definition.DefinitionMap>
				const componentType = Object.keys(
					formField
				)[0] as metadata.MetadataKey
				const subFieldDefinition = formField[componentType]
				return (
					<component.Component
						key={index}
						componentType={componentType}
						definition={{
							...subFieldDefinition,
							fieldId: `${property.name}->${subProperty.name}`,
						}}
						path={path}
						context={context}
					/>
				)
			})}
		</FieldWrapper>
	)
}

export default StructProperty
