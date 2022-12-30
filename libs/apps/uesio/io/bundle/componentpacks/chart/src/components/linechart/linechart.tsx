import { FC } from "react"
import { styles, hooks } from "@uesio/ui"
import { Props } from "./linechartdefinition"

import { Line } from "react-chartjs-2"
import { Chart, registerables } from "chart.js"
import { aggregate } from "../../shared/aggregate"
Chart.register(...registerables)

const ChartComponent: FC<Props> = (props) => {
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

	const uesio = hooks.useUesio(props)

	// Get a list of all wires used
	const wireNames = definition.series.map(({ wire }) => wire || "")

	const wires = uesio.wire.useWires(wireNames, context)

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
				<Line
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
