import { definition, api, wire, collection, styles } from "@uesio/ui"

interface MonthFilterProps {
  path: string
  wire: wire.Wire
  fieldMetadata: collection.Field
  condition: wire.ValueConditionState
}

const getMonthYearDateKey = (year: number, month: number) =>
  `${year}-${(month + "").padStart(2, "0")}`

const parseDateConditionValue = (value: wire.FieldValue) => {
  // Get the condition value
  if (value === "THIS_MONTH") {
    const current = new Date()
    return getMonthYearDateKey(current.getFullYear(), current.getMonth() + 1)
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

const MonthFilter: definition.UtilityComponent<MonthFilterProps> = (props) => {
  const { wire, context, condition } = props
  const wireId = wire.getId()

  const classes = styles.useUtilityStyleTokens(
    StyleDefaults,
    props,
    "uesio/io.field",
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
                inactive: !value,
              },
            },
            {
              signal: "wire/LOAD",
              wires: [wireId],
            },
          ],
          context,
        )
      }}
    />
  )
}

export default MonthFilter
