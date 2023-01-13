import { definition, api, wire, collection, styles } from "@uesio/ui"

interface MonthFilterProps {
	path: string
	wire: wire.Wire
	fieldMetadata: collection.Field
	conditionId: string | undefined
}

const getMonthYearDateKey = (year: number, month: number) =>
	`${year}-${(month + "").padStart(2, "0")}`

const parseDateConditionValue = (value: wire.FieldValue) => {
	// Get the condition value
	if (value === "THIS_MONTH") {
		const current = new Date()
		return getMonthYearDateKey(
			current.getFullYear(),
			current.getMonth() + 1
		)
	}
	if (typeof value !== "string") {
		return ""
	}
	return value
}

const MonthFilter: definition.UtilityComponent<MonthFilterProps> = (props) => {
	const { wire, fieldMetadata, context } = props

	const conditionId = props.conditionId || props.path || ""
	const wireId = wire.getId()

	const condition = (wire.getCondition(conditionId) || {
		id: conditionId,
		field: fieldMetadata.getId(),
		operator: "IN",
	}) as wire.ValueConditionState

	const classes = styles.useUtilityStyles(
		{
			input: {},
			readonly: {},
		},
		props,
		"uesio/io.field"
	)

	return (
		<input
			value={parseDateConditionValue(condition.value)}
			className={classes.input}
			type="month"
			onChange={(event) => {
				const value = event.target.value
				api.signal.runMany(
					[
						{
							signal: "wire/SET_CONDITION",
							wire: wireId,
							condition: {
								...condition,
								value,
								active: !!value,
							},
						},
						{
							signal: "wire/LOAD",
							wires: [wireId],
						},
					],
					context
				)
			}}
		/>
	)
}

export default MonthFilter
