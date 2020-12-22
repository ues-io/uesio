import { FunctionComponent, SyntheticEvent } from "react"

import { SvgIconProps, IconButton, Tooltip } from "@material-ui/core"

interface Props {
	title?: string
	icon: FunctionComponent<SvgIconProps>
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
	icon: Icon,
}) => {
	const localColor = disabled ? "#ccc" : color
	const button = (
		<IconButton
			onClick={onClick}
			size="small"
			disabled={disabled}
			className={className}
		>
			<Icon
				style={{
					fontSize: "0.9rem",
					color: localColor,
				}}
				fontSize="small"
			/>
		</IconButton>
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
