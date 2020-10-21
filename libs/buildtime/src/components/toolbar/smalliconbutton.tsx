import React, { FC, ReactElement, SyntheticEvent } from "react"

import { SvgIconProps, IconButton, Tooltip } from "@material-ui/core"

type Props = {
	title?: string
	icon: FC<SvgIconProps>
	color?: string
	onClick?: (event: SyntheticEvent) => void
	disabled?: boolean
	className?: string
}

function SmallIconButton(props: Props): ReactElement {
	const color = props.disabled ? "#ccc" : props.color
	const button = (
		<IconButton
			onClick={props.onClick}
			size="small"
			disabled={props.disabled}
			className={props.className}
		>
			<props.icon
				style={{
					fontSize: "0.9rem",
					color,
				}}
				fontSize="small"
			></props.icon>
		</IconButton>
	)
	if (props.title && !props.disabled) {
		return (
			<Tooltip
				enterDelay={1000}
				title={props.title}
				arrow
				placement="top"
			>
				{button}
			</Tooltip>
		)
	}
	return button
}

export default SmallIconButton
