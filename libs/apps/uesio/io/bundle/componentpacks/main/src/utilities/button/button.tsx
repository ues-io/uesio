import { MouseEvent, ReactNode } from "react"
import { definition, styles } from "@uesio/ui"
import Tooltip from "../tooltip/tooltip"
import { Placement } from "@floating-ui/react"
import Icon from "../icon/icon"

export type ButtonIconPlacement = "start" | "end"

interface ButtonUtilityProps {
	onClick?: (e: MouseEvent) => void
	label?: string
	isSelected?: boolean
	icon?: ReactNode
	iconText?: string
	iconFill?: boolean
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
	icon: [],
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
		iconFill,
		iconText,
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

	const iconNode = iconText ? (
		<Icon
			classes={{
				root: classes.icon,
			}}
			fill={iconFill}
			context={context}
			icon={context.mergeString(iconText)}
		/>
	) : (
		icon
	)

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
			{iconPlacement === "start" && iconNode}
			{currentLabel && (
				<span className={classes.label}>
					{context.mergeString(currentLabel)}
				</span>
			)}
			{iconPlacement === "end" && iconNode}
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
