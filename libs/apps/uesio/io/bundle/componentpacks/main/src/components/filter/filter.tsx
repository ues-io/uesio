import {
	api,
	collection,
	component,
	wire,
	definition,
	metadata,
} from "@uesio/ui"
import FieldWrapper from "../../utilities/fieldwrapper/fieldwrapper"
import MonthFilter from "../../utilities/monthfilter/monthfilter"
import SelectFilter from "../../utilities/selectfilter/selectfilter"
import WeekFilter from "../../utilities/weekfilter/weekfilter"
import DateFilter from "../../utilities/datefilter/datefilter"
import NumberFilter from "../../utilities/numberfilter/numberfilter"
import CheckboxFilter from "../../utilities/checkboxfilter/checkboxfilter"
import MultiSelectFilter from "../../utilities/multiselectfilter/multiselectfilter"
import TextFilter from "../../utilities/textfilter/textfilter"
import TimestampFilter from "../../utilities/timestampfilter/timestampfilter"
import ReferenceFilter from "../../utilities/referencefilter/referencefilter"
import GroupFilter, {
	GroupFilterProps,
} from "../../utilities/groupfilter/groupfilter"
import { LabelPosition, ReferenceFieldOptions } from "../field/field"

type FilterDefinition = {
	fieldId: string
	wire: string
	label?: string
	labelPosition?: LabelPosition
	displayAs?: string
	wrapperVariant: metadata.MetadataKey
	conditionId?: string
	placeholder?: string
	operator: wire.ConditionOperators
	reference?: ReferenceFieldOptions
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
	const { displayAs, placeholder } = definition
	const fieldMetadata = common.fieldMetadata
	const type = fieldMetadata.getType()
	switch (type) {
		case "TEXT":
		case "LONGTEXT":
		case "EMAIL":
			return <TextFilter {...common} placeholder={placeholder} />
		case "NUMBER":
			return <NumberFilter {...common} />
		case "CHECKBOX":
			return <CheckboxFilter {...common} displayAs={displayAs} />
		case "SELECT":
			if (displayAs === "MULTISELECT")
				return <MultiSelectFilter {...common} />
			return <SelectFilter {...common} />
		case "MULTISELECT":
			return <MultiSelectFilter {...common} />
		case "TIMESTAMP":
			return <TimestampFilter {...common} />
		case "DATE": {
			if (displayAs === "MONTH") return <MonthFilter {...common} />
			if (displayAs === "WEEK") return <WeekFilter {...common} />
			return <DateFilter {...common} />
		}
		case "USER":
		case "REFERENCE": {
			return (
				<ReferenceFilter
					{...common}
					options={definition.reference as ReferenceFieldOptions}
				/>
			)
		}
		default:
			return null
	}
}

const getDefaultCondition = (
	path: string,
	fieldMetadata: collection.Field,
	operator: wire.ConditionOperators,
	displayAs: string
) => {
	const type = fieldMetadata.getType()
	const fieldName = fieldMetadata.getId()
	switch (type) {
		case "DATE": {
			return !displayAs
				? {
						id: path,
						operator: "EQ",
						field: fieldName,
				  }
				: {
						id: path,
						operator: "IN",
						field: fieldName,
				  }
		}
		case "MULTISELECT": {
			return {
				id: path,
				operator: operator || "HAS_ANY",
				field: fieldName,
			}
		}
		case "USER":
		case "REFERENCE": {
			return {
				id: path,
				operator: "EQ",
				field: fieldName,
			}
		}
		case "TEXT":
		case "LONGTEXT":
		case "EMAIL":
			return {
				id: path,
				operator: "CONTAINS",
				field: fieldName,
			}
		default:
			return {
				id: path,
				field: fieldName,
			}
	}
}

const Filter: definition.UC<FilterDefinition> = (props) => {
	const { context, definition, path } = props
	const { fieldId, conditionId, operator, displayAs } = definition
	const wire = api.wire.useWire(definition.wire, context)
	if (!wire) return null
	const collection = wire.getCollection()
	const existingCondition =
		wire.getCondition(conditionId || path) || undefined
	// Field metadata is not needed for group conditions
	const fieldMetadata = collection.getField(
		isValueCondition(existingCondition) ? existingCondition.field : fieldId
	)

	if (!fieldMetadata) return null

	let condition = existingCondition
	if (!condition && fieldMetadata) {
		condition = getDefaultCondition(
			path,
			fieldMetadata,
			operator,
			displayAs || ""
		) as wire.ValueConditionState
	}

	if (!condition) return null

	const isGroup = isGroupCondition(condition)

	let label = definition.label
	if (!label && isGroup) label = `Toggle group: ${condition?.id}`
	if (!label) label = fieldMetadata?.getLabel()

	const common = {
		path,
		context,
		fieldMetadata,
		wire,
		condition,
		variant:
			definition[component.STYLE_VARIANT] ||
			"uesio/io.field:uesio/io.default",
	}

	return (
		<FieldWrapper
			label={label}
			labelPosition={definition.labelPosition}
			context={context}
			variant={definition.wrapperVariant}
		>
			{isGroup ? (
				<GroupFilter
					{...(common as GroupFilterProps & definition.UtilityProps)}
				/>
			) : (
				getFilterContent(common as CommonProps, definition)
			)}
		</FieldWrapper>
	)
}

export default Filter
