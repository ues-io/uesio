import { component, definition } from "@uesio/ui"
import { ChartDefinition } from "../../shared/definitions"

const LineChartComponent: definition.UC<ChartDefinition> = (props) => {
	const { definition, context } = props

	const Chart = component.getUtility("uesio/io.chart")

	return <Chart definition={definition} context={context} type="line" />
}
LineChartComponent.displayName = "LineChart"

export default LineChartComponent
