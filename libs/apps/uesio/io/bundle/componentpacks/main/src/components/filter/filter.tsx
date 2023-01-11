import { api, collection, wire, definition, metadata } from "@uesio/ui"
import FieldWrapper from "../../utilities/fieldwrapper/fieldwrapper"
import MonthFilter from "../../utilities/monthfilter/monthfilter"
import SelectFilter from "../../utilities/selectfilter/selectfilter"
import WeekFilter from "../../utilities/weekfilter/weekfilter"
import { LabelPosition } from "../field/field"

type FilterDefinition = {
	fieldId: string
	wire: string
	label?: string
	labelPosition?: LabelPosition
	displayAs?: string
	wrapperVariant: metadata.MetadataKey
	conditionId?: string
}

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

const Filter: definition.UC<FilterDefinition> = (props) => {
	const { context, definition } = props
	const { fieldId, conditionId } = definition
	const wire = api.wire.useWire(definition.wire, context)
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

/*
const FilterPropertyDefinition: builder.BuildPropertiesDefinition = {
	title: "Filter",
	description: "Just a Filter",
	link: "https://docs.ues.io/",
	defaultDefinition: () => ({}),
	properties: [
		{
			name: "wire",
			type: "WIRE",
			label: "Wire",
		},
		{
			name: "fieldId",
			type: "TEXT",
			label: "id",
		},
	],
	sections: [],
	actions: [],
	type: "component",
	classes: ["root"],
}
*/

export default Filter
