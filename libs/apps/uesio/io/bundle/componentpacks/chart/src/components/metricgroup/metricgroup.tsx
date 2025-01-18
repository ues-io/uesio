import { api, component, definition, signal } from "@uesio/ui"

import { aggregate, SeriesDefinition } from "../../shared/aggregate"
import { LabelsDefinition } from "../../shared/labels"

type MetricGroupDefinition = {
  labels: LabelsDefinition
  title?: string
  series: SeriesDefinition[]
  signals?: signal.SignalDefinition[]
  unit?: string
}

const MetricGroupComponent: definition.UC<MetricGroupDefinition> = (props) => {
  const MetricUtility = component.getUtility("uesio/io.metric")
  const { definition, context } = props
  if (!definition || !definition.series || !definition.labels) {
    console.warn("missing definition for metric group")
    return null
  }

  // Get a list of all wires used
  const wireNames = definition.series.map(({ wire }) => wire || "")

  const wires = api.wire.useWires(wireNames, context)

  const [datasets, categories] = aggregate(
    wires,
    definition.labels,
    definition.series,
    context,
  )

  return (
    <>
      {Object.keys(categories).map((category, i) => {
        const value = datasets[0].data[i]
        const handler = api.signal.getHandler(
          definition.signals,
          props.context.addComponentFrame("uesio/chart.metricgroup", {
            category,
          }),
        )
        return (
          <MetricUtility
            key={category}
            value={value}
            title={categories[category]}
            unit={context.merge(definition.unit)}
            context={context}
            onClick={handler}
          />
        )
      })}
    </>
  )
}

export default MetricGroupComponent
