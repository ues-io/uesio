import { definition, collection, context, wire } from "@uesio/ui"

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
	mode: context.FieldMode
	fieldId: string
	hideLabel: boolean
	record: wire.WireRecord
	wire: wire.Wire
	value?: string
} & definition.BaseProps

export { FieldProps, FieldDefinition, RendererProps }
