import { FC } from "react"
import { styles, component, hooks } from "@uesio/ui"
import { Props } from "./metricdefinition"

const MetricUtility = component.getUtility("uesio/io.metric")

const MetricComponent: FC<Props> = (props) => {
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

	const uesio = hooks.useUesio(props)
	const handler = uesio.signal.getHandler(definition.signals)
	const value = context.merge(definition.value)

	return (
		<MetricUtility
			onClick={handler}
			classes={classes}
			context={context}
			title={definition.title}
			value={value}
			unit={definition.unit}
		/>
	)
}

export default MetricComponent
