import { FC } from "react"
import { component } from "@uesio/ui"
import { Props } from "./piechartdefinition"
import { Pie } from "react-chartjs-2"
import { ChartUtilityProps } from "../../utility/chart/chart"
import { CHART_COLORS, ChartDefinition } from "../../shared/chartutils"

const IOChart =
	component.registry.getUtility<ChartUtilityProps>("uesio/io.chart")

const ChartComponent: FC<Props> = (props) => {
	const { definition } = props
	const def = {
		...definition,
		series: definition?.series?.map((s) => ({
			...s,
			options: {
				...s.options,
				backgroundColor: Object.values(CHART_COLORS),
			},
		})),
	} as ChartDefinition

	return (
		<IOChart
			ChartComponent={Pie}
			definition={def}
			context={props.context}
		/>
	)
}

export default ChartComponent
