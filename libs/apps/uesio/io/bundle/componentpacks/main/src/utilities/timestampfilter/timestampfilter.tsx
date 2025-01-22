import { definition, api, wire, collection, styles } from "@uesio/ui"

interface TimestampFilterProps {
  path: string
  wire: wire.Wire
  fieldMetadata: collection.Field
  condition: wire.ValueConditionState
}

const toTimestamp = (date: string) => {
  const datum = Date.parse(date)
  return datum / 1000
}

const datetimeLocal = (dt: Date) => {
  dt.setMinutes(dt.getMinutes() - dt.getTimezoneOffset())
  return dt.toISOString().slice(0, 19)
}

const StyleDefaults = Object.freeze({
  input: [],
  readonly: [],
})

const TimestampFilter: definition.UtilityComponent<TimestampFilterProps> = (
  props,
) => {
  const { wire, context, condition } = props
  const wireId = wire.getId()
  const timestamp = condition.value as number
  const date = new Date(timestamp * 1000)
  const classes = styles.useUtilityStyleTokens(
    StyleDefaults,
    props,
    "uesio/io.field",
  )
  return (
    <input
      value={timestamp && datetimeLocal(date)}
      className={classes.input}
      type="datetime-local"
      step="1"
      onChange={(event) => {
        const value = event.target.value
          ? toTimestamp(event.target.value)
          : null
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

export default TimestampFilter
