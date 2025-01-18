import { component, definition, styles } from "@uesio/ui"
import { ChartDefinition } from "../../shared/definitions"

const StyleDefaults = Object.freeze({
  root: [],
  title: [],
  chart: [],
})

const BarChartComponent: definition.UC<ChartDefinition> = (props) => {
  const { definition, context } = props

  const Chart = component.getUtility("uesio/io.chart")

  const classes = styles.useStyleTokens(StyleDefaults, props)

  return (
    <Chart
      definition={definition}
      classes={classes}
      context={context}
      type="bar"
    />
  )
}
BarChartComponent.displayName = "BarChart"

export default BarChartComponent
