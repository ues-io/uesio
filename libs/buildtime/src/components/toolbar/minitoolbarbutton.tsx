import React, { FunctionComponent, useState, memo } from "react"
import clsx from "clsx"
import {
	makeStyles,
	Theme,
	createStyles,
	IconButton,
	Tooltip,
	PopperPlacementType,
	SvgIconProps,
	colors,
} from "@material-ui/core"

type Props = {
	id: string
	icon: FunctionComponent<SvgIconProps>
	title: string
	disabled?: boolean
	tooltipPlacement?: PopperPlacementType
	variant?: "save" | "cancel"
	onClick?: (id: string) => void
}

const useStyles = makeStyles((theme: Theme) =>
	createStyles({
		button: {
			margin: theme.spacing(1),
			marginBottom: 0,
			padding: "8px",
		},
		save: {
			color: colors.green[800],
		},
		cancel: {
			color: colors.grey[700],
		},
	})
)

const MiniToolbarButton: FunctionComponent<Props> = ({
	variant,
	title,
	tooltipPlacement,
	disabled,
	onClick,
	id,
	icon: Icon,
}) => {
	const classes = useStyles()

	// Special handling for tooltips so that they
	// Go away when clicked.
	const [open, setOpen] = useState(false)
	const [listen, setListen] = useState(true)
	const buttonClasses = clsx(
		classes.button,
		variant && classes?.[variant]
			? {
					[classes[variant]]:
						variant === "save" || variant === "cancel",
			  }
			: {}
	)

	return (
		<Tooltip
			title={title}
			placement={tooltipPlacement}
			arrow={true}
			open={open}
			disableFocusListener={true}
			onOpen={(): void => {
				if (listen) {
					setOpen(true)
					setListen(false)
				}
			}}
			onClose={(): void => {
				setOpen(false)
				setListen(true)
			}}
		>
			<IconButton
				color="primary"
				className={buttonClasses}
				disabled={disabled}
				size="small"
				onClick={(): void => {
					setOpen(false)
					onClick?.(id)
				}}
			>
				<Icon style={{ fontSize: 16 }} />
			</IconButton>
		</Tooltip>
	)
}

export default memo(MiniToolbarButton)
