import { styles, api, definition } from "@uesio/ui"

import { Line, Bar } from "react-chartjs-2"
import { Chart, registerables } from "chart.js"
import { LabelsDefinition } from "../../shared/labels"
import { aggregate, SeriesDefinition } from "../../shared/aggregate"

Chart.register(...registerables)

export type ChartProps = {
	definition: ChartDefinition
	type: "line" | "bar"
}

type TicksOptions = {
	count?: number
}

type ScaleOptions = {
	beginAtZero?: boolean
	ticks?: TicksOptions
	suggestedMax?: number
}

type ScalesOptions = {
	y?: ScaleOptions
	x?: ScaleOptions
}

export type ChartDefinition = {
	labels: LabelsDefinition
	title?: string
	series: SeriesDefinition[]
	scales?: ScalesOptions
} & definition.BaseDefinition

const StyleDefaults = Object.freeze({
	root: [],
	title: [],
	chart: [],
})

const ChartComponent: definition.UtilityComponent<ChartProps> = (props) => {
	const { definition, context, type } = props
	if (!definition) {
		console.warn(`missing definition for chart`)
		return null
	}
	if (!definition.series) {
		console.warn(`No series defined for ${type} chart`)
		return null
	}
	if (!definition.labels) {
		console.warn(`No labels defined for ${type} chart`)
		return null
	}

	const classes = styles.useUtilityStyleTokens(
		StyleDefaults,
		props,
		`uesio/io.${type}chart`
	)

	// Get a list of all wires used
	const wireNames = definition.series.map(({ wire }) => wire || "")

	const wires = api.wire.useWires(wireNames, context)

	const foundAllWires =
		Object.keys(wires).length === wireNames.length &&
		Object.values(wires).every((w) => !!w)

	const [datasets, categories] = foundAllWires
		? aggregate(wires, definition.labels, definition.series, context)
		: [[], {}]

	const labels = Object.values(categories)
	const ChartType = type === "line" ? Line : Bar

	return (
		<div className={classes.root}>
			{definition.title && (
				<h3 className={classes.title}>{definition.title}</h3>
			)}
			<div className={classes.chart}>
				<ChartType
					data={{
						datasets,
						labels,
					}}
					options={{
						maintainAspectRatio: false,
						responsive: true,
						scales: definition.scales,
					}}
				/>
			</div>
		</div>
	)
}

export default ChartComponent
