import React, { ReactElement, SyntheticEvent, FC } from "react"
import {
	useTheme,
	SvgIconProps,
	makeStyles,
	createStyles,
} from "@material-ui/core"
import SmallIconButton from "../../toolbar/smalliconbutton"

type Props = {
	title: string
	icon: FC<SvgIconProps>
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

function ActionButton(props: Props): ReactElement {
	const theme = useTheme()
	const classes = useStyles(props)

	return (
		<SmallIconButton
			title={props.title}
			onClick={props.onClick}
			icon={props.icon}
			color={theme.palette.primary.main}
			disabled={props.disabled}
			className={classes.root}
		></SmallIconButton>
	)
}

export default ActionButton
