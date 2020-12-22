import { FunctionComponent } from "react"
import {
	createStyles,
	makeStyles,
	Theme,
	Typography,
	SvgIconProps,
} from "@material-ui/core"
import SmallIconButton from "./smalliconbutton"

type Props = {
	title: string
	icon?: FunctionComponent<SvgIconProps>
	iconColor?: string
	iconOnClick?: () => void
}

const useStyles = makeStyles((theme: Theme) =>
	createStyles({
		wrapper: {
			display: "flex",
			padding: theme.spacing(0.5, 1),
			borderBottom: "1px solid #80cbc4",
			fontSize: "8pt",
			backgroundColor: theme.palette.primary.light,
		},
		textWrapper: {
			flex: "1",
			margin: "4px 0",
			color: theme.palette.primary.dark,
			textTransform: "uppercase",
		},
		title: {
			...theme.typography.button,
			fontSize: "9pt",
			margin: "2px 0",
			lineHeight: "1.4",
		},
		iconWrapper: {
			flex: "0",
			marginTop: "3px",
		},
	})
)

const ToolbarTitle: FunctionComponent<Props> = (props) => {
	const classes = useStyles()
	return (
		<div className={classes.wrapper}>
			<div className={classes.textWrapper}>
				<Typography className={classes.title}>{props.title}</Typography>
			</div>
			<div className={classes.iconWrapper}>
				{props.icon && (
					<SmallIconButton
						icon={props.icon}
						color={props.iconColor}
						onClick={props.iconOnClick}
					/>
				)}
			</div>
		</div>
	)
}

export default ToolbarTitle
