import { FC } from "react"
import { styles, hooks, component } from "@uesio/ui"
import { Props } from "./metricgroupdefinition"

import { aggregate } from "../../shared/aggregate"

const MetricUtility = component.getUtility("uesio/io.metric")

const MetricGroupComponent: FC<Props> = (props) => {
	const { definition, context } = props
	if (!definition || !definition.series || !definition.labels) {
		console.warn("missing definition for metric group")
		return null
	}

	const classes = styles.useStyles(
		{
			root: {},
		},
		props
	)

	const uesio = hooks.useUesio(props)

	// Get a list of all wires used
	const wireNames = definition.series.map(({ wire }) => wire || "")

	const wires = uesio.wire.useWires(wireNames)

	const [datasets, categories] = aggregate(
		wires,
		definition.labels,
		definition.series
	)

	return (
		<>
			{Object.keys(categories).map((category, i) => {
				const value = datasets[0].data[i]
				const handler = uesio.signal.getHandler(
					definition.signals,
					props.context.addFrame({
						params: {
							category,
						},
					})
				)
				return (
					<MetricUtility
						key={category}
						value={value}
						title={categories[category]}
						unit="Hours"
						context={context}
						onClick={handler}
					/>
				)
			})}
		</>
	)

	return <div className={classes.root}>blah</div>
}

export default MetricGroupComponent
