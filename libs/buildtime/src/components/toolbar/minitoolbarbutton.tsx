import React, { FC, useState, memo } from "react"
import {
	makeStyles,
	Theme,
	createStyles,
	IconButton,
	useTheme,
	Tooltip,
	PopperPlacementType,
	SvgIconProps,
} from "@material-ui/core"
import { material } from "@uesio/ui"

type Props = {
	id: string
	icon: FC<SvgIconProps>
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
			marginBottom: "0px",
			padding: "8px",
		},
		save: {
			color: material.colors.green[800],
		},
		cancel: {
			color: material.colors.grey[700],
		},
	})
)

const MiniToolbarButton: FC<Props> = memo((props: Props) => {
	const theme = useTheme()
	const classes = useStyles(theme)

	// Special handling for tooltips so that they
	// Go away when clicked.
	const [open, setOpen] = useState(false)
	const [listen, setListen] = useState(true)

	const tooltipProps = {
		title: props.title,
		placement: props.tooltipPlacement,
		arrow: true,
		open: open,
		disableFocusListener: true,
		onOpen: (): void => {
			if (listen) {
				setOpen(true)
				setListen(false)
			}
		},
		onClose: (): void => {
			setOpen(false)
			setListen(true)
		},
	}

	const applyClasses = [classes.button]

	if (props.variant === "save" || props.variant === "cancel") {
		applyClasses.push(classes[props.variant])
	}

	const classNames = applyClasses.join(" ")

	return (
		<Tooltip {...tooltipProps}>
			<IconButton
				{...{
					color: "primary",
					className: classNames,
					disabled: props.disabled,
					size: "small",
					onClick: (): void => {
						setOpen(false)
						return props.onClick && props.onClick(props.id)
					},
				}}
			>
				<props.icon
					style={{
						fontSize: 16,
					}}
				></props.icon>
			</IconButton>
		</Tooltip>
	)
})

MiniToolbarButton.displayName = "MiniToolbarButton"

export default MiniToolbarButton
