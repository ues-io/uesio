import { FunctionComponent } from "react"
import { definition, styles } from "@uesio/ui"

interface TextFieldProps extends definition.UtilityProps {
	label?: string
	hide?: boolean
}

const FieldLabel: FunctionComponent<TextFieldProps> = (props) => {
	const { label, hide } = props
	const classes = styles.useUtilityStyles(
		{
			root: {},
		},
		props
	)
	return hide ? null : <div className={classes.root}>{label}</div>
}

export default FieldLabel
