import { api, collection, wire, definition, metadata } from "@uesio/ui"
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
	reference?: ReferenceFilterOptions
	order?: wire.OrderState[]
}
export type ReferenceFilterOptions = {
	template?: string
	conditions?: wire.WireConditionState[]
	returnFields?: Record<string, unknown>
	searchFields?: Record<string, unknown>
	order?: wire.OrderState[]
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

const getReferenceFilterOptions = (definition: FilterDefinition) => {
	const { order, reference } = definition
	const searchFields =
		reference && reference.searchFields
			? Object.keys(reference.searchFields)
			: undefined
	const returnFields =
		reference && reference.returnFields
			? Object.keys(reference.returnFields)
			: undefined
	return {
		template: reference?.template,
		conditions: reference?.conditions,
		searchFields,
		returnFields,
		order: reference?.order || order,
	} as ReferenceFieldOptions
}

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
					options={getReferenceFilterOptions(definition)}
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
	switch (type) {
		case "DATE": {
			return !displayAs
				? {
						id: path,
						operator: "EQ",
						field: fieldMetadata.getId(),
				  }
				: {
						id: path,
						operator: "IN",
						field: fieldMetadata.getId(),
				  }
		}
		case "MULTISELECT": {
			return {
				id: path,
				operator: operator || "HAS_ANY",
				field: fieldMetadata.getId(),
			}
		}
		case "USER":
		case "REFERENCE": {
			return {
				id: path,
				operator: "EQ",
				field: fieldMetadata.getId(),
			}
		}
		case "TEXT":
		case "LONGTEXT":
		case "EMAIL":
			return {
				id: path,
				operator: "CONTAINS",
				field: fieldMetadata.getId(),
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
