import { FunctionComponent } from "react"
import { definition, styles } from "@uesio/ui"

interface ButtonProps extends definition.UtilityProps {
	onClick?: () => void
	label?: string
	width?: string
	isSelected?: boolean
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
			selected: {},
		},
		props
	)
	const { onClick, label } = props
	return (
		<button
			onClick={onClick}
			className={styles.cx(
				classes.root,
				props.isSelected && classes.selected
			)}
		>
			<div className={classes.label}>{label}</div>
		</button>
	)
}

export default Button
