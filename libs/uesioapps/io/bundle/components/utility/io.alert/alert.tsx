import { FunctionComponent } from "react"
import { definition, styles } from "@uesio/ui"

interface AlertProps extends definition.UtilityProps {
	text?: string
	severity?: string
}

const Alert: FunctionComponent<AlertProps> = (props) => {
	const { text, severity } = props
	const classes = styles.useUtilityStyles(
		{
			root: {
				verticalAlign: "inherit",
			},
		},
		props
	)

	const mergedText = props.context.merge(text)
	return <div className={classes.root}>{mergedText}</div>
}

export default Alert
