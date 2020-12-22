import { SyntheticEvent, FunctionComponent } from "react"
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

const ActionButton: FunctionComponent<Props> = (props) => {
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
		/>
	)
}

export default ActionButton
