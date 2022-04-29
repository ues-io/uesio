import { FC } from "react"
import { styles, hooks, wire } from "@uesio/ui"
import {
	Props,
	Scale,
	SeriesDefinition,
	TimeScale,
} from "./linechartdefinition"

import { Line } from "react-chartjs-2"
import { Chart, registerables } from "chart.js"
import "chartjs-adapter-luxon"
Chart.register(...registerables)

const getTimeScale = (scale: TimeScale) => ({
	type: "time" as const,
	time: {
		unit: scale.unit,
	},
})

const getScales = (
	wires: { [k: string]: wire.Wire | undefined },
	scales: Scale[]
) =>
	Object.fromEntries(
		scales.map((scale) => {
			if (scale.type === "TIME") {
				return ["x", getTimeScale(scale)]
			}
			throw new Error("Invalid Scale Type")
		})
	)

const getBucketValue = (
	record: wire.WireRecord,
	scale: Scale,
	series: SeriesDefinition
) => {
	const value = record.getFieldValue<string>(series.groupingField)
	if (scale.type === "TIME") {
		const dateValue = new Date(value)
		if (scale.unit === "month") {
			const bucketDate = new Date(
				dateValue.getFullYear(),
				dateValue.getMonth()
			)
			return bucketDate.getTime()
		}
	}
	return value
}

const getDataSets = (
	wires: { [k: string]: wire.Wire | undefined },
	scales: Scale[],
	serieses: SeriesDefinition[]
) =>
	serieses.map((series) => {
		// Loop over the data in the wire
		const wire = wires[series.wire]
		const buckets: Record<
			string,
			{
				y: number
				x: string | number
			}
		> = {}
		wire?.getData().forEach((record) => {
			const bucketValue = getBucketValue(record, scales[0], series)
			// Get Time from bucketValue

			const aggValue = record.getFieldValue<number>(series.valueField)
			const currentBucket = buckets[bucketValue]
			if (!currentBucket) {
				buckets[bucketValue] = {
					y: aggValue,
					x: bucketValue,
				}
			} else {
				buckets[bucketValue] = {
					y: currentBucket.y + aggValue,
					x: bucketValue,
				}
			}
		})
		return {
			label: series.label,
			tension: 0.4,
			data: Object.values(buckets),
		}
	})

const ChartComponent: FC<Props> = (props) => {
	const { definition } = props
	if (!definition) {
		console.warn("missing definition for chart")
		return null
	}

	const classes = styles.useStyles(
		{
			root: {},
			title: {},
			chart: {},
		},
		props
	)

	const uesio = hooks.useUesio(props)

	// Get a list of all wires used
	const wireNames: string[] = []

	definition.series.forEach((series) => {
		wireNames.push(series.wire)
	})

	const wires = uesio.wire.useWires(wireNames)

	const scales = getScales(wires, definition.scales)

	const datasets = getDataSets(wires, definition.scales, definition.series)

	return (
		<div className={classes.root}>
			{definition.title && (
				<h3 className={classes.title}>{definition.title}</h3>
			)}

			<div className={classes.chart}>
				<Line
					datasetIdKey="id"
					data={{
						datasets,
					}}
					options={{
						maintainAspectRatio: false,
						scales,
					}}
				/>
			</div>
		</div>
	)
}

export default ChartComponent
