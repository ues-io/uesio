import { definition, api, wire, collection, styles } from "@uesio/ui"

interface WeekFilterProps {
	path: string
	wire: wire.Wire
	fieldMetadata: collection.Field
	condition: wire.ValueConditionState
}

const getWeekNumber = (checkDate: Date) => {
	// Copy date so don't modify original
	const d = new Date(
		Date.UTC(
			checkDate.getFullYear(),
			checkDate.getMonth(),
			checkDate.getDate()
		)
	)
	// Set to nearest Thursday: current date + 4 - current day number
	// Make Sunday's day number 7
	d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7))
	// Get first day of year
	const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
	// Calculate full weeks to nearest Thursday
	const weekNo = Math.ceil(
		((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7
	)
	// Return array of year and week number
	return [d.getUTCFullYear(), weekNo]
}

const parseDateConditionValue = (value: wire.FieldValue) => {
	// Get the condition value
	if (value === "THIS_WEEK") {
		const current = new Date()
		const [year, weekNo] = getWeekNumber(current)
		return `${year}-W${weekNo}`
	}
	if (typeof value !== "string") {
		return ""
	}
	return value
}

const StyleDefaults = Object.freeze({
	input: [],
	readonly: [],
})

const WeekFilter: definition.UtilityComponent<WeekFilterProps> = (props) => {
	const { wire, context, condition } = props
	const wireId = wire.getId()

	const classes = styles.useUtilityStyleTokens(
		StyleDefaults,
		props,
		"uesio/io.field"
	)

	return (
		<input
			value={parseDateConditionValue(condition.value)}
			className={classes.input}
			type="week"
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
								inactive: !value,
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

export default WeekFilter
