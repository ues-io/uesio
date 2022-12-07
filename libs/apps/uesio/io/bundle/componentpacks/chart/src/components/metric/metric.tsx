import { FC } from "react"
import { styles } from "@uesio/ui"
import { Props } from "./metricdefinition"

const MetricComponent: FC<Props> = (props) => {
	const { definition } = props

	console.log(definition)

	const classes = styles.useStyles(
		{
			root: {},
		},
		props
	)

	//const uesio = hooks.useUesio(props)

	return <div className={classes.root}>This is a metric</div>
}

export default MetricComponent
