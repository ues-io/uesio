import { definition, api, wire, collection, styles } from "@uesio/ui"

interface DateFilterProps {
  path: string
  wire: wire.Wire
  fieldMetadata: collection.Field
  condition: wire.ValueConditionState
}

const parseDateConditionValue = (value: wire.FieldValue) => {
  // Get the condition value
  if (typeof value !== "string") {
    return ""
  }
  return value
}

const StyleDefaults = Object.freeze({
  input: [],
  readonly: [],
})

const DateFilter: definition.UtilityComponent<DateFilterProps> = (props) => {
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
      type="date"
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

export default DateFilter
