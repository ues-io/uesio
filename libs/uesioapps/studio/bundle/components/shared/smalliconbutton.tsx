import { FunctionComponent, SyntheticEvent } from "react"

import { Tooltip } from "@material-ui/core"

import { context, component } from "@uesio/ui"

const IconButton = component.registry.getUtility("io.iconbutton")

interface Props {
	title?: string
	icon: string
	color?: string
	onClick?: (event: SyntheticEvent) => void
	disabled?: boolean
	className?: string
}

const SmallIconButton: FunctionComponent<Props> = ({
	disabled,
	color,
	onClick,
	className,
	title,
	icon,
}) => {
	const localColor = disabled ? "#ccc" : color
	const button = (
		<IconButton
			onClick={onClick}
			size="small"
			disabled={disabled}
			className={className}
			icon={icon}
			context={new context.Context()}
		/>
	)
	if (title && !disabled) {
		return (
			<Tooltip enterDelay={1000} title={title} arrow placement="top">
				{button}
			</Tooltip>
		)
	}
	return button
}

export default SmallIconButton
