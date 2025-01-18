import { styles, api, definition, signal } from "@uesio/ui"
import Metric from "../../utilities/metric/metric"

type MetricDefinition = {
  title?: string
  unit?: string
  value: string
  signals?: signal.SignalDefinition[]
  wire?: string
}

const StyleDefaults = Object.freeze({
  root: [],
  title: [],
  valuewrapper: [],
  value: [],
  unit: [],
})

const MetricComponent: definition.UC<MetricDefinition> = (props) => {
  const { definition, context } = props

  //This is here because we need to re-render the metric component
  //we need to tranform the context.merge into a hook
  api.wire.useWires([definition.wire || ""], context)

  const classes = styles.useStyleTokens(StyleDefaults, props)

  const value = context.merge(definition.value)

  return (
    <Metric
      onClick={api.signal.getHandler(definition.signals, context)}
      classes={classes}
      context={context}
      title={definition.title}
      value={value as string}
      unit={definition.unit}
    />
  )
}

export default MetricComponent
