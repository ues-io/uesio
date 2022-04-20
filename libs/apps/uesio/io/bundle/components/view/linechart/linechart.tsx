import { FC } from "react"
import { styles, hooks, wire } from "@uesio/ui"
import { Props } from "./linechartdefinition"

import { Line } from "react-chartjs-2"
import { Chart, registerables } from "chart.js"
Chart.register(...registerables)

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

	// Create an object of instantiated wires
	const wires: Record<string, wire.Wire> = definition.series
		.map(({ wire }) => wire)
		.reduce(
			(prev, curr) => ({ ...prev, [curr]: uesio.wire.useWire(curr) }),
			{}
		)

	// Loop over data from a wire and return array of fieldvalues
	const getValuesArray = (w: string, f: string) =>
		wires[w].getData().map((rec) => rec.getFieldValue(f))

	const { wire: labelsWire, field: labelsField } = definition.xAxis

	return (
		<div className={classes.root}>
			{definition.title && (
				<h3 className={classes.title}>{definition.title}</h3>
			)}

			<div className={classes.chart}>
				<Line
					datasetIdKey="id"
					data={{
						labels: getValuesArray(labelsWire, labelsField),
						datasets: definition.series.map((s) => ({
							label: s.label,
							data: getValuesArray(s.wire, s.field),
							...s.options,
						})),
					}}
				/>
			</div>
		</div>
	)
}

export default ChartComponent
