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
	isPending?: boolean
	pendingLabel?: string
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
	label: [],
	pending: [],
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
		isPending,
		pendingLabel,
		id,
		tooltip,
		context,
		tooltipPlacement,
		tooltipOffset,
		link,
	} = props

	const isDisabled = isPending || disabled
	const currentLabel = isPending && pendingLabel ? pendingLabel : label

	const Tag = link ? "a" : "button"
	const button = (
		<Tag
			id={id}
			href={link}
			disabled={isDisabled}
			onClick={onClick}
			className={styles.cx(
				classes.root,
				disabled && classes.disabled,
				isSelected && classes.selected,
				isPending && classes.pending
			)}
		>
			{iconPlacement === "start" && icon}
			{currentLabel && (
				<span className={classes.label}>
					{context.mergeString(currentLabel)}
				</span>
			)}
			{iconPlacement === "end" && icon}
		</Tag>
	)

	return tooltip && !isDisabled ? (
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
