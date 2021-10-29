import { FunctionComponent } from "react"
import { definition, styles } from "@uesio/ui"

interface ButtonUtilityProps extends definition.UtilityProps {
	onClick?: () => void
	label?: string
	isSelected?: boolean
	icon?: React.Component
	disabled?: boolean
}

const Button: FunctionComponent<ButtonUtilityProps> = (props) => {
	const classes = styles.useUtilityStyles(
		{
			root: {
				fontFamily: "inherit",
				border: "none",
				cursor: "pointer",
			},
			label: {
				verticalAlign: "middle",
			},
			selected: {},
		},
		props
	)
	const { onClick, label, disabled, isSelected, icon } = props
	return (
		<button
			disabled={disabled}
			onClick={onClick}
			className={styles.cx(classes.root, isSelected && classes.selected)}
		>
			{icon}
			<span className={classes.label}>{label}</span>
		</button>
	)
}

export { ButtonUtilityProps }

export default Button
