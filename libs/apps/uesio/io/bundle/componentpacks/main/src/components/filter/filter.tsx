import { FunctionComponent } from "react"

import { FilterProps } from "./filterdefinition"
import { component, hooks, collection, wire, definition } from "@uesio/ui"

const SelectFilter = component.getUtility("uesio/io.selectfilter")
const FieldWrapper = component.getUtility("uesio/io.fieldwrapper")

type CommonProps = {
	fieldMetadata: collection.Field
	wire: wire.Wire
} & definition.UtilityProps

const getFilterContent = (common: CommonProps) => {
	const fieldMetadata = common.fieldMetadata
	const type = fieldMetadata.getType()

	switch (type) {
		case "SELECT":
			return <SelectFilter {...common} />
		default:
			return null
	}
}

const Filter: FunctionComponent<FilterProps> = (props) => {
	const { context, definition } = props
	const { fieldId } = definition
	const uesio = hooks.useUesio(props)
	const wire = uesio.wire.useWire(definition.wire)
	if (!wire) return null

	const collection = wire.getCollection()

	const fieldMetadata = collection.getField(fieldId)

	if (!fieldMetadata) return null

	const label = definition.label || fieldMetadata.getLabel()

	const common = {
		context,
		fieldMetadata,
		wire,
		variant:
			definition["uesio.variant"] || "uesio/io.filter:uesio/io.default",
	}

	return (
		<FieldWrapper
			label={label}
			labelPosition={definition.labelPosition}
			context={context}
			variant={definition.wrapperVariant}
		>
			{getFilterContent(common)}
		</FieldWrapper>
	)
}

export default Filter
