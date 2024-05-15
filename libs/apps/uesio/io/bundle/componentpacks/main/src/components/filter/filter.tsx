import {
	api,
	collection,
	component,
	wire,
	definition,
	metadata,
	styles,
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
import ToggleFilter, {
	ToggleFilterProps,
} from "../../utilities/togglefilter/togglefilter"
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

const { isValueCondition, isGroupCondition, isParamCondition } = wire

const getFilterContent = (
	common: CommonProps,
	definition: FilterDefinition
) => {
	const { displayAs, placeholder } = definition
	const fieldMetadata = common.fieldMetadata
	const type = fieldMetadata.getType()

	// Any condition type should be displayable as a TOGGLE optionally, to enable/disable the condition
	if (displayAs === "TOGGLE") {
		return (
			<ToggleFilter
				{...(common as ToggleFilterProps & definition.UtilityProps)}
			/>
		)
	}

	switch (type) {
		case "TEXT":
		case "LONGTEXT":
		case "EMAIL":
			return <TextFilter {...common} placeholder={placeholder} />
		case "NUMBER":
			return <NumberFilter {...common} />
		case "CHECKBOX":
			return <CheckboxFilter {...common} />
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

const getDefaultOperator = (
	type: wire.FieldType,
	displayAs: string
): wire.ConditionOperators => {
	switch (type) {
		case "DATE":
			return !displayAs ? "EQ" : "IN"
		case "SELECT":
			return displayAs === "MULTISELECT" ? "IN" : "EQ"
		case "MULTISELECT":
			return "HAS_ANY"
		case "USER":
		case "REFERENCE":
			return "EQ"
		case "TEXT":
		case "LONGTEXT":
		case "EMAIL":
			return "CONTAINS"
		default:
			return "EQ"
	}
}

const getDefaultCondition = (
	path: string,
	fieldMetadata: collection.Field,
	operator: wire.ConditionOperators,
	displayAs: string
): wire.ValueConditionState => ({
	id: path,
	field: fieldMetadata.getId(),
	valueSource: "VALUE",
	operator:
		operator || getDefaultOperator(fieldMetadata.getType(), displayAs),
})

const getFieldId = (
	existingCondition: wire.WireConditionState | undefined,
	fieldId: string
) => {
	if (existingCondition) {
		if (isParamCondition(existingCondition)) {
			return (existingCondition as wire.ParamConditionState).field
		} else if (isValueCondition(existingCondition)) {
			return (existingCondition as wire.ValueConditionState).field
		}
	}
	return fieldId
}

const StyleDefaults = Object.freeze({
	root: [],
})

const Filter: definition.UC<FilterDefinition> = (props) => {
	const { context, definition, path } = props
	const { fieldId, conditionId, operator, displayAs } = definition
	const wire = api.wire.useWire(definition.wire, context)
	if (!wire) return null
	const collection = wire.getCollection()
	const existingCondition =
		wire.getCondition(conditionId || path) || undefined
	// Field metadata is not needed for group conditions
	const useFieldId = getFieldId(existingCondition, fieldId)
	const fieldMetadata = collection.getField(useFieldId)
	if (!fieldMetadata) return null

	let condition = existingCondition
	if (!condition && fieldMetadata) {
		condition = getDefaultCondition(
			path,
			fieldMetadata,
			operator,
			displayAs || ""
		)
	}

	if (!condition) return null

	const isGroup = isGroupCondition(condition)

	let label = context.mergeString(definition.label)
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
			"uesio/io.field:uesio/io.filter",
	}
	const classes = styles.useStyleTokens(StyleDefaults, props)

	return (
		<FieldWrapper
			label={label}
			labelPosition={definition.labelPosition}
			context={context}
			classes={classes}
			variant={definition.wrapperVariant}
		>
			{isGroup ? (
				<ToggleFilter
					{...(common as ToggleFilterProps & definition.UtilityProps)}
				/>
			) : (
				getFilterContent(common as CommonProps, definition)
			)}
		</FieldWrapper>
	)
}

export default Filter
