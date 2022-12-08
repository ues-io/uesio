import { FC } from "react"
import { styles, component, hooks } from "@uesio/ui"
import { Props } from "./metricdefinition"

const Tile = component.getUtility("uesio/io.tile")

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
		<Tile
			onClick={handler}
			classes={{ root: classes.root }}
			context={context}
		>
			<div className={classes.title}>{definition.title}</div>
			<div className={classes.valuewrapper}>
				<div className={classes.value}>{value}</div>
				<div className={classes.unit}>{definition.unit}</div>
			</div>
		</Tile>
	)
}

export default MetricComponent
