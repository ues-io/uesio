import { styles, api, definition, signal } from "@uesio/ui"
import Metric from "../../utilities/metric/metric"

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
		<Metric
			onClick={api.signal.getHandler(definition.signals, context)}
			classes={classes}
			context={context}
			title={definition.title}
			value={value as string}
			unit={definition.unit}
		/>
	)
}

export default MetricComponent
