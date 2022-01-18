import { FC } from "react"
import { definition, styles, context, collection, wire } from "@uesio/ui"

interface Props extends definition.UtilityProps {
	fieldLabel: string
}

const RadioButtons: FC<Props> = (props) => {
	const { children, fieldLabel } = props

	const classes = styles.useUtilityStyles(
		{
			fieldset: {
				border: 0,
				padding: "0.01em 0 0 0",
				margin: 0,
				minWidth: 0,
			},
			legend: {
				display: "none",
			},
		},
		props
	)

	return (
		<fieldset className={classes.fieldset} {...props}>
			<legend className={classes.legend}>{fieldLabel}</legend>
			{children}
		</fieldset>
	)
}

export default RadioButtons
