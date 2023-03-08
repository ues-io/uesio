import { FunctionComponent, MouseEvent, ReactNode } from "react"
import { definition, styles } from "@uesio/ui"
import Tooltip from "../tooltip/tooltip"
import { Placement } from "@floating-ui/react"

interface ButtonUtilityProps extends definition.UtilityProps {
	onClick?: (e: MouseEvent) => void
	label?: string
	isSelected?: boolean
	icon?: ReactNode
	disabled?: boolean
	tooltip?: string
	tooltipPlacement?: Placement
	tooltipOffset?: number
	link?: string
}

const Button: FunctionComponent<ButtonUtilityProps> = (props) => {
	const classes = styles.useUtilityStyles(
		{
			root: {
				all: "unset",
				cursor: "pointer",
				display: "inline-grid",
				gridAutoFlow: "column",
				columnGap: "8px",
				alignItems: "center",
				background: "none",
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
		link,
	} = props

	const Tag = link ? "a" : "button"

	const button = (
		<Tag
			id={id}
			href={link}
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
		</Tag>
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
