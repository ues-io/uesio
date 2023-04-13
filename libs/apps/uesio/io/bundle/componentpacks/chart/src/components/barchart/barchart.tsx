import { styles, api, definition } from "@uesio/ui"
import { Bar } from "react-chartjs-2"
import { Chart, registerables } from "chart.js"
import { aggregate, SeriesDefinition } from "../../shared/aggregate"
import { LabelsDefinition } from "../../shared/labels"
Chart.register(...registerables)

type BarChartDefinition = {
	labels: LabelsDefinition
	title?: string
	series: SeriesDefinition[]
}

const ChartComponent: definition.UC<BarChartDefinition> = (props) => {
	const { definition, context } = props
	if (!definition || !definition.series || !definition.labels) {
		console.warn("missing definition for chart")
		return null
	}

	const classes = styles.useStyles(
		{
			root: {
				minWidth: 0,
			},
			title: {},
			chart: {},
		},
		props
	)

	// Get a list of all wires used
	const wireNames: string[] = []

	definition.series.forEach((series) => {
		wireNames.push(series.wire)
	})

	const wires = api.wire.useWires(wireNames, context)

	const [datasets, categories] = aggregate(
		wires,
		definition.labels,
		definition.series
	)

	const labels = Object.values(categories)

	return (
		<div className={classes.root}>
			{definition.title && (
				<h3 className={classes.title}>{definition.title}</h3>
			)}
			<div className={classes.chart}>
				<Bar
					data={{
						datasets,
						labels,
					}}
					options={{
						maintainAspectRatio: false,
						responsive: true,
					}}
				/>
			</div>
		</div>
	)
}

export default ChartComponent
