import { FunctionComponent } from "react"
import { definition, styles, component } from "@uesio/ui"

interface MetricProps extends definition.UtilityProps {
	onClick?: () => void
	title?: string
	unit?: string
	value: string
}

const Tile = component.getUtility("uesio/io.tile")

const Metric: FunctionComponent<MetricProps> = (props) => {
	const classes = styles.useUtilityStyles(
		{
			root: {},
			title: {},
			valuewrapper: {},
			value: {},
			unit: {},
		},
		props
	)
	return (
		<Tile
			onClick={props.onClick}
			classes={{ root: classes.root }}
			context={props.context}
		>
			<div className={classes.title}>{props.title}</div>
			<div className={classes.valuewrapper}>
				<div className={classes.value}>{props.value}</div>
				<div className={classes.unit}>{props.unit}</div>
			</div>
		</Tile>
	)
}

export default Metric
