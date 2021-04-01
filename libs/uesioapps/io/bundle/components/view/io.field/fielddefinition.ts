import { definition, collection, wire, builder } from "@uesio/ui"
import { field } from "@uesio/constants"

type FieldDefinition = {
	fieldId: string
	hideLabel: boolean
	label?: string
}

interface FieldProps extends definition.BaseProps {
	definition: FieldDefinition
}

type RendererProps = {
	fieldMetadata: collection.Field
	mode: field.FieldMode
	fieldId: string
	hideLabel: boolean
	record: wire.WireRecord
	wire: wire.Wire
	value?: string
} & definition.BaseProps

const FieldPropertyDefinition: builder.BuildPropertiesDefinition = {
	title: "Field",
	defaultDefinition: () => ({}),
	properties: [
		{
			name: "label",
			type: "TEXT",
			label: "Label",
		},
		{
			name: "hideLabel",
			type: "BOOLEAN",
			label: "Hide label",
		},
	],
	sections: [],
	actions: [],
}

export { FieldProps, FieldDefinition, RendererProps }

export default FieldPropertyDefinition
