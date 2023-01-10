import { styles, component, api, definition, signal } from "@uesio/ui"

const MetricUtility = component.getUtility("uesio/io.metric")

type MetricDefinition = {
	title?: string
	unit?: string
	value: string
	signals?: signal.SignalDefinition[]
}

const MetricComponent: definition.UC<MetricDefinition> = (props) => {
	const { definition, context } = props

	const classes = styles.useStyles(
		{
			root: {},
			title: {},
			valuewrapper: {},
			value: {},
			unit: {},
		},
		props
	)

	const value = context.merge(definition.value)

	return (
		<MetricUtility
			onClick={api.signal.getHandler(definition.signals, context)}
			classes={classes}
			context={context}
			title={definition.title}
			value={value}
			unit={definition.unit}
		/>
	)
}

/*
const PropertyDefinition: builder.BuildPropertiesDefinition = {
	title: "Metric",
	description: "A metric box",
	link: "https://docs.ues.io/",
	defaultDefinition: () => ({
		text: "New metric",
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
export default MetricComponent
