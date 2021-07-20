import { FunctionComponent } from "react"
import { definition, styles, component } from "@uesio/ui"
import type { Placement } from "@popperjs/core"

interface IconButtonProps extends definition.UtilityProps {
	onClick?: () => void
	label?: string
	icon?: string
	size?: string
	disabled?: boolean
	tooltipPlacement?: Placement
	// CSS syntax
	iconSize: string
}

const Icon = component.registry.getUtility("io.icon")
const Tooltip = component.registry.getUtility("io.tooltip")

const IconButton: FunctionComponent<IconButtonProps> = (props) => {
	const { context, icon, iconSize, label, tooltipPlacement, onClick } = props
	const classes = styles.useUtilityStyles(
		{
			root: {
				fontFamily: "inherit",
				border: "none",
				cursor: onClick ? "pointer" : "inherit",
				display: "block",
				width: "100%",
				fontSize: "1.2em",
				background: "transparent",
			},
		},
		props
	)
	const button = (
		<button onClick={onClick} className={classes.root}>
			<Icon fontSize={iconSize} context={context} icon={icon} />
		</button>
	)
	return label ? (
		<Tooltip text={label} context={context} placement={tooltipPlacement}>
			{button}
		</Tooltip>
	) : (
		button
	)
}

export default IconButton
