import { FunctionComponent } from "react"
import { definition, styles, component } from "@uesio/ui"
import type { Placement } from "@popperjs/core"

interface IconButtonUtilityProps extends definition.UtilityProps {
	onClick?: () => void
	label?: string
	icon?: string
	color?: string
	disabled?: boolean
	tooltipPlacement?: Placement
}

const Icon = component.registry.getUtility("io.icon")
const Tooltip = component.registry.getUtility("io.tooltip")

const IconButton: FunctionComponent<IconButtonUtilityProps> = (props) => {
	const { context, icon, label, tooltipPlacement, onClick, disabled, color } =
		props
	const classes = styles.useUtilityStyles(
		{
			root: {
				fontFamily: "inherit",
				border: "none",
				cursor: onClick ? "pointer" : "inherit",
				display: "block",
				width: "100%",
				background: "transparent",
				...(color && {
					color,
				}),
				lineHeight: 0,
			},
			disabled: {
				opacity: 0.3,
				cursor: "inherit",
			},
		},
		props
	)
	const button = (
		<button
			onClick={disabled ? undefined : onClick}
			className={styles.cx(classes.root, disabled && classes.disabled)}
		>
			<Icon context={context} icon={icon} color={color} />
		</button>
	)
	return label && !disabled ? (
		<Tooltip text={label} context={context} placement={tooltipPlacement}>
			{button}
		</Tooltip>
	) : (
		<div>{button}</div>
	)
}

export { IconButtonUtilityProps }

export default IconButton
