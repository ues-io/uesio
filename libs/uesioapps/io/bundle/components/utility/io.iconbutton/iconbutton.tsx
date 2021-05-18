import { FunctionComponent } from "react"
import { definition, styles, component } from "@uesio/ui"

interface IconButtonProps extends definition.UtilityProps {
	onClick?: () => void
	label?: string
	icon?: string
	size?: string
	disabled?: boolean
}

const Icon = component.registry.getUtility("io.icon")

const IconButton: FunctionComponent<IconButtonProps> = (props) => {
	const classes = styles.useUtilityStyles(
		{
			root: {
				fontFamily: "inherit",
				border: "none",
				cursor: "pointer",
				display: "block",
				width: "100%",
				background: "transparent",
			},
		},
		props
	)
	const { context, icon } = props
	return (
		<button onClick={props.onClick} className={classes.root}>
			<Icon size={props.size} context={context} icon={icon} />
		</button>
	)
}

export default IconButton
