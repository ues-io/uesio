import { definition, collection, wire } from "@uesio/ui"
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

export { FieldProps, FieldDefinition, RendererProps }
