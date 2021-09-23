import { FunctionComponent } from "react"
import { definition, styles, component } from "@uesio/ui"

interface ButtonProps extends definition.UtilityProps {
	onClick?: () => void
	label?: string
	width?: string
	isSelected?: boolean
	icon?: React.Component
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
			label: {
				verticalAlign: "middle",
			},
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
			{props.icon}
			<span className={classes.label}>{label}</span>
		</button>
	)
}

export default Button
