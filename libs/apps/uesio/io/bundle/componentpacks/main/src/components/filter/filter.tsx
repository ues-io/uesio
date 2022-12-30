import { FunctionComponent } from "react"

import { FilterDefinition, FilterProps } from "./filterdefinition"
import { component, hooks, collection, wire, definition } from "@uesio/ui"

const SelectFilter = component.getUtility("uesio/io.selectfilter")
const MonthFilter = component.getUtility("uesio/io.monthfilter")
const WeekFilter = component.getUtility("uesio/io.weekfilter")
const FieldWrapper = component.getUtility("uesio/io.fieldwrapper")

type CommonProps = {
	fieldMetadata: collection.Field
	wire: wire.Wire
	conditionId: string | undefined
} & definition.UtilityProps

const getFilterContent = (
	common: CommonProps,
	definition: FilterDefinition
) => {
	const { displayAs } = definition

	const fieldMetadata = common.fieldMetadata
	const type = fieldMetadata.getType()

	switch (type) {
		case "SELECT":
			return <SelectFilter {...common} />
		case "DATE": {
			if (displayAs === "MONTH") return <MonthFilter {...common} />
			if (displayAs === "WEEK") return <WeekFilter {...common} />
			return null
		}
		default:
			return null
	}
}

const Filter: FunctionComponent<FilterProps> = (props) => {
	const { context, definition } = props
	const { fieldId, conditionId } = definition
	const uesio = hooks.useUesio(props)
	const wire = uesio.wire.useWire(definition.wire, context)
	if (!wire) return null

	const collection = wire.getCollection()

	const fieldMetadata = collection.getField(fieldId)

	if (!fieldMetadata) return null

	const label = definition.label || fieldMetadata.getLabel()

	const common = {
		context,
		fieldMetadata,
		wire,
		conditionId,
		variant:
			definition["uesio.variant"] || "uesio/io.field:uesio/io.default",
	}

	return (
		<FieldWrapper
			label={label}
			labelPosition={definition.labelPosition}
			context={context}
			variant={definition.wrapperVariant}
		>
			{getFilterContent(common, definition)}
		</FieldWrapper>
	)
}

export default Filter
