import { api, component, definition, signal } from "@uesio/ui"

import { aggregate, SeriesDefinition } from "../../shared/aggregate"
import { LabelsDefinition } from "../../shared/labels"

type MetricGroupDefinition = {
	labels: LabelsDefinition
	title?: string
	series: SeriesDefinition[]
	signals?: signal.SignalDefinition[]
}

const MetricGroupComponent: definition.UC<MetricGroupDefinition> = (props) => {
	const MetricUtility = component.getUtility("uesio/io.metric")
	const { definition, context } = props
	if (!definition || !definition.series || !definition.labels) {
		console.warn("missing definition for metric group")
		return null
	}

	// Get a list of all wires used
	const wireNames = definition.series.map(({ wire }) => wire || "")

	const wires = api.wire.useWires(wireNames, context)

	const [datasets, categories] = aggregate(
		wires,
		definition.labels,
		definition.series
	)

	return (
		<>
			{Object.keys(categories).map((category, i) => {
				const value = datasets[0].data[i]
				const handler = api.signal.getHandler(
					definition.signals,
					// TODO: What was this needed for?
					// Can we name this signals invocation? Need to understand how this is configured...
					// Can we give this a name? Or do other components require this???
					// props.context.addParamsFrame({
					// 	category,
					// })
					props.context
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
}

/*
const PropertyDefinition: builder.BuildPropertiesDefinition = {
	title: "Metric Group",
	description: "Visualized data with numbers.",
	link: "https://docs.ues.io/",
	defaultDefinition: () => ({
		text: "New metric group",
	}),
	properties: [
		{
			name: "title",
			type: "TEXT",
			label: "Title",
		},
	],
	sections: [],
	actions: [],
	traits: ["uesio.standalone"],
	classes: ["root"],
	type: "component",
	category: "VISUALIZATION",
}
*/

export default MetricGroupComponent
