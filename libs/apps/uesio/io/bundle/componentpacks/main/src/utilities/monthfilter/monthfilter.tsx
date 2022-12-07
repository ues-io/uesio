import { FunctionComponent } from "react"
import { definition, hooks, wire, collection, styles } from "@uesio/ui"

interface MonthFilterProps extends definition.UtilityProps {
	wire: wire.Wire
	fieldMetadata: collection.Field
	conditionId: string | undefined
}

const getMonthYearDateKey = (year: number, month: number) =>
	`${year}-${(month + "").padStart(2, "0")}`

const parseDateConditionValue = (value: string | string[]) => {
	// Get the condition value
	if (value === "THIS_MONTH") {
		const current = new Date()
		return getMonthYearDateKey(
			current.getFullYear(),
			current.getMonth() + 1
		)
	}
	return value
}

const MonthFilter: FunctionComponent<MonthFilterProps> = (props) => {
	const { wire, fieldMetadata, context } = props

	const uesio = hooks.useUesio(props)
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
		props
	)

	return (
		<input
			value={parseDateConditionValue(condition.value)}
			className={classes.input}
			type="month"
			onChange={(event) => {
				const value = event.target.value
				uesio.signal.runMany(
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
