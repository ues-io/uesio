import { FunctionComponent, ReactNode } from "react"
import { definition, styles, component } from "@uesio/ui"
import { Placement } from "@popperjs/core"

interface ButtonUtilityProps extends definition.UtilityProps {
	onClick?: () => void
	label?: string
	isSelected?: boolean
	icon?: ReactNode
	disabled?: boolean
	tooltip?: string
	tooltipPlacement?: Placement
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const Tooltip = component.getUtility<any>("uesio/io.tooltip")

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
		props
	)
	const {
		onClick,
		label,
		disabled,
		isSelected,
		icon,
		tooltip,
		context,
		tooltipPlacement,
	} = props

	const button = (
		<button
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
		<Tooltip text={tooltip} context={context} placement={tooltipPlacement}>
			{button}
		</Tooltip>
	) : (
		button
	)
}

export { ButtonUtilityProps }

export default Button
