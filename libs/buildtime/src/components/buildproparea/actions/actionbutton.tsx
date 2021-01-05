import React, { SyntheticEvent, FunctionComponent } from "react"
import {
	useTheme,
	SvgIconProps,
	makeStyles,
	createStyles,
} from "@material-ui/core"
import SmallIconButton from "../../toolbar/smalliconbutton"

interface Props {
	title: string
	icon: FunctionComponent<SvgIconProps>
	onClick?: (event: SyntheticEvent) => void
	disabled?: boolean
}

const useStyles = makeStyles(() =>
	createStyles({
		root: {
			marginRight: "8px",
		},
	})
)

const ActionButton: FunctionComponent<Props> = ({
	title,
	onClick,
	icon,
	disabled,
}) => {
	const theme = useTheme()
	const classes = useStyles()

	return (
		<SmallIconButton
			title={title}
			onClick={onClick}
			icon={icon}
			color={theme.palette.primary.main}
			disabled={disabled}
			className={classes.root}
		/>
	)
}

export default ActionButton
