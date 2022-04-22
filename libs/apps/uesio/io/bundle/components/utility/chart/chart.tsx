import { FC } from "react"
import { hooks, wire, definition, styles } from "@uesio/ui"
import { Chart, ChartDefinition } from "../../shared/chartutils"
import { Bar, Line, Pie } from "react-chartjs-2"
import {
	Chart as C,
	LineController,
	PieController,
	BarElement,
	ArcElement,
	LinearScale,
	CategoryScale,
	PointElement,
	LineElement,
} from "chart.js"
C.register(
	LineController,
	PieController,
	BarElement,
	ArcElement,
	CategoryScale,
	LinearScale,
	PointElement,
	LineElement
)

export interface ChartUtilityProps extends definition.UtilityProps {
	ChartComponent: typeof Bar | typeof Line | typeof Pie
	definition: ChartDefinition
}

const ChartComponent: FC<ChartUtilityProps> = (props) => {
	const classes = styles.useStyles(
		{
			root: {},
		},
		props
	)
	const uesio = hooks.useUesio(props)
	const { definition } = props
	// Create an object of instantiated wires
	const wires: Record<string, wire.Wire> | null = uesio.wire.useWires(
		definition.series?.map(({ wire }) => wire)
	)

	if (!definition.series || !wires) {
		console.warn("missing data for rendering chart", { definition, wires })
		return null
	}

	const { aggregateFieldValue } = new Chart(wires)

	const { wire: labelsWire, field: labelsField } = definition.xAxis || {}

	return (
		<props.ChartComponent
			datasetIdKey="id"
			className={classes.root}
			data={{
				labels: aggregateFieldValue(labelsWire, labelsField),
				datasets: definition.series.map((s) => ({
					label: s.label,
					data: aggregateFieldValue(s.wire, s.field),
					...s.options,
				})),
			}}
		/>
	)
}

export default ChartComponent
