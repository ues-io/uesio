import { FunctionComponent } from "react";
import { Drawer, makeStyles, createStyles } from "@material-ui/core"

type Props = {
	anchor: "bottom" | "left" | "right" | "top" | undefined
	width: number
	open?: boolean
	left?: number
	right?: number
	variant?: "permanent" | "persistent" | "temporary" | undefined
}

const useStyles = makeStyles(() =>
	createStyles({
		drawer: {
			width: (props: Props): string => props.width + "px",
			flexShrink: 0,
		},
		drawerPaper: {
			width: (props: Props): string => props.width + "px",
			left: (props: Props): string =>
				props.left ? props.left + "px" : "",
			right: (props: Props): string =>
				props.right ? props.right + "px" : "",
			backgroundColor: "transparent",
			borderLeft: "0px solid transparent",
			borderRight: "0px solid transparent",
			overflow: "visible",
		},
	})
)

const MiniToolbar: FunctionComponent<Props> = (props) => {
	const classes = useStyles(props)

	return (
		<Drawer
			variant={props.variant || "permanent"}
			open={props.open}
			anchor={props.anchor}
			className={classes.drawer}
			classes={{
				paper: classes.drawerPaper,
			}}
			transitionDuration={0}
		>
			{props.children}
		</Drawer>
	)
}

export default MiniToolbar
