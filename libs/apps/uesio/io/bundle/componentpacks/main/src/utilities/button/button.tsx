import { MouseEvent, ReactNode } from "react"
import { definition, styles } from "@uesio/ui"
import Tooltip from "../tooltip/tooltip"
import { Placement } from "@floating-ui/react"

export type ButtonIconPlacement = "start" | "end"

interface ButtonUtilityProps {
	onClick?: (e: MouseEvent) => void
	label?: string
	isSelected?: boolean
	icon?: ReactNode
	iconPlacement?: ButtonIconPlacement
	disabled?: boolean
	tooltip?: string
	tooltipPlacement?: Placement
	tooltipOffset?: number
	link?: string
}

const StyleDefaults = Object.freeze({
	root: [],
	selected: [],
	disabled: [],
})

const Button: definition.UtilityComponent<ButtonUtilityProps> = (props) => {
	const classes = styles.useUtilityStyleTokens(
		StyleDefaults,
		props,
		"uesio/io.button"
	)
	const {
		onClick,
		label,
		disabled,
		isSelected,
		icon,
		iconPlacement = "start",
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
			className={styles.process(
				undefined,
				classes.root,
				disabled && classes.disabled,
				isSelected && classes.selected
			)}
		>
			{iconPlacement === "start" && icon}
			{label && <span>{context.merge(label)}</span>}
			{iconPlacement === "end" && icon}
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

export default Button
