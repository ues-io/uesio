import { FunctionComponent, ReactNode } from "react"
import { definition, styles } from "@uesio/ui"
import Tooltip from "../tooltip/tooltip"
import { Placement } from "@floating-ui/react"

interface ButtonUtilityProps extends definition.UtilityProps {
	onClick?: () => void
	label?: string
	isSelected?: boolean
	icon?: ReactNode
	disabled?: boolean
	tooltip?: string
	tooltipPlacement?: Placement
	tooltipOffset?: number
}

const Button: FunctionComponent<ButtonUtilityProps> = (props) => {
	const classes = styles.useUtilityStyles(
		{
			root: {
				fontFamily: "inherit",
				border: "none",
				cursor: "pointer",
				display: "inline-grid",
				gridAutoFlow: "column",
				columnGap: "8px",
				alignItems: "center",
				background: "none",
				color: "inherit",
				fontSize: "inherit",
			},
			label: {},
			selected: {},
			disabled: {
				cursor: "default",
			},
		},
		props,
		"uesio/io.button"
	)
	const {
		onClick,
		label,
		disabled,
		isSelected,
		icon,
		id,
		tooltip,
		context,
		tooltipPlacement,
		tooltipOffset,
	} = props

	const button = (
		<button
			id={id}
			disabled={disabled}
			onClick={onClick}
			className={styles.cx(
				classes.root,
				disabled && classes.disabled,
				isSelected && classes.selected
			)}
		>
			{icon}
			{label && (
				<span className={classes.label}>{context.merge(label)}</span>
			)}
		</button>
	)

	return tooltip && !disabled ? (
		<Tooltip
			text={tooltip}
			context={context}
			placement={tooltipPlacement}
			offset={tooltipOffset}
		>
			{button}
		</Tooltip>
	) : (
		button
	)
}

export { ButtonUtilityProps }

export default Button
