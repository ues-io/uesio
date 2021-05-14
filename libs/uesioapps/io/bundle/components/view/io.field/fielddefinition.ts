import { definition, collection, wire, builder, context } from "@uesio/ui"

type FieldDefinition = {
	fieldId: string
	hideLabel: boolean
	label?: string
	id?: string
	displayAs?: string
}

type FieldState = {
	value: string
	originalValue: string
	fieldId: string
	recordId: string
	collectionId: string
	fileName: string
	mimeType: string
}

interface FieldProps extends definition.BaseProps {
	definition: FieldDefinition
}

type RendererProps = {
	fieldMetadata: collection.Field
	mode: context.FieldMode
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

export { FieldProps, FieldDefinition, RendererProps, FieldState }

export default FieldPropertyDefinition
