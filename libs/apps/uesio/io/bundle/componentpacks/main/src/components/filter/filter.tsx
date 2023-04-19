import { api, collection, wire, definition, metadata } from "@uesio/ui"
import FieldWrapper from "../../utilities/fieldwrapper/fieldwrapper"
import MonthFilter from "../../utilities/monthfilter/monthfilter"
import SelectFilter from "../../utilities/selectfilter/selectfilter"
import WeekFilter from "../../utilities/weekfilter/weekfilter"
import NumberFilter from "../../utilities/numberfilter/numberfilter"
import CheckboxFilter from "../../utilities/checkboxfilter/checkboxfilter"
import GroupFilter, {
	GroupFilterProps,
} from "../../utilities/groupfilter/groupfilter"
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
	path: string
	fieldMetadata: collection.Field
	wire: wire.Wire
	condition: wire.ValueConditionState
	isGroup: boolean
} & definition.UtilityProps

const isValueCondition = wire.isValueCondition
const isGroupCondition = wire.isGroupCondition

const getFilterContent = (
	common: CommonProps,
	definition: FilterDefinition
) => {
	const { displayAs } = definition

	const fieldMetadata = common.fieldMetadata
	const type = fieldMetadata.getType()

	switch (type) {
		case "NUMBER":
			return <NumberFilter {...common} />
		case "CHECKBOX":
			return <CheckboxFilter {...common} displayAs={displayAs} />
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

const getDefaultCondition = (path: string, fieldMetadata: collection.Field) => {
	const type = fieldMetadata.getType()

	switch (type) {
		case "DATE": {
			return {
				id: path,
				operator: "IN",
				field: fieldMetadata.getId(),
			}
		}
		default:
			return {
				id: path,
				field: fieldMetadata.getId(),
			}
	}
}

const Filter: definition.UC<FilterDefinition> = (props) => {
	const { context, definition, path } = props
	const { fieldId, conditionId } = definition
	const wire = api.wire.useWire(definition.wire, context)
	if (!wire) return null

	const collection = wire.getCollection()
	const existingCondition =
		wire.getCondition(conditionId || path) || undefined
	// Field metadata is not needed for group conditions
	const fieldMetadata = collection.getField(
		isValueCondition(existingCondition) ? existingCondition.field : fieldId
	)

	let condition = existingCondition
	if (!condition && fieldMetadata) {
		condition = getDefaultCondition(
			path,
			fieldMetadata
		) as wire.ValueConditionState
	}
	const isGroup = isGroupCondition(condition)
	const label =
		definition.label ||
		(isGroup && condition
			? `Toggle group: ${condition?.id}`
			: fieldMetadata?.getLabel())

	if (!condition) return null

	const common = {
		path,
		context,
		fieldMetadata,
		wire,
		condition,
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
			{isGroup ? (
				<GroupFilter {...(common as GroupFilterProps)} />
			) : (
				getFilterContent(common as CommonProps, definition)
			)}
		</FieldWrapper>
	)
}

export default Filter
