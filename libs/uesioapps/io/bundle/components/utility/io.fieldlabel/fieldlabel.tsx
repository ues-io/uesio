import { FunctionComponent } from "react"
import { definition, styles } from "@uesio/ui"

interface TextFieldProps extends definition.UtilityProps {
	label?: string
}

const FieldLabel: FunctionComponent<TextFieldProps> = (props) => {
	const { label } = props
	const classes = styles.useUtilityStyles(
		{
			root: {},
		},
		props
	)
	return <div className={classes.root}>{label}</div>
}

export default FieldLabel
