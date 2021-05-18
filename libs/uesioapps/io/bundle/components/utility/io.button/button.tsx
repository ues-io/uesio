import { FunctionComponent } from "react"
import { definition, styles } from "@uesio/ui"

interface ButtonProps extends definition.UtilityProps {
	onClick?: () => void
	label?: string
	width?: string
}

const Button: FunctionComponent<ButtonProps> = (props) => {
	const width = props.definition?.width as string
	const classes = styles.useUtilityStyles(
		{
			root: {
				fontFamily: "inherit",
				border: "none",
				cursor: "pointer",
				...(width && { width }),
			},
			label: {},
		},
		props
	)
	const { onClick, label } = props
	return (
		<button onClick={onClick} className={classes.root}>
			<div className={classes.label}>{label}</div>
		</button>
	)
}

export default Button
