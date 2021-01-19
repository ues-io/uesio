import React, { FunctionComponent } from "react"
import { Drawer, makeStyles, createStyles } from "@material-ui/core"

type Props = {
	anchor?: "bottom" | "left" | "right" | "top"
	width: number
	open?: boolean
	left?: number
	right?: number
	variant?: "permanent" | "persistent" | "temporary" | undefined
}

const useStyles = makeStyles(() =>
	createStyles({
		drawer: {
			width: ({ width }: Props) => `${width}px`,
			flexShrink: 0,
		},
		drawerPaper: {
			width: ({ width }: Props) => `${width}px`,
			left: ({ left }: Props) => (left ? `${left}px` : ""),
			right: ({ right }: Props) => (right ? `${right}px` : ""),
			backgroundColor: "transparent",
			borderLeft: "0px solid transparent",
			borderRight: "0px solid transparent",
			overflow: "visible",
		},
	})
)

const MiniToolbar: FunctionComponent<Props> = (props) => {
	const classes = useStyles(props)
	const { variant, anchor, children, open } = props

	return (
		<Drawer
			variant={variant || "permanent"}
			open={open}
			anchor={anchor}
			className={classes.drawer}
			classes={{ paper: classes.drawerPaper }}
			transitionDuration={0}
		>
			{children}
		</Drawer>
	)
}

export default MiniToolbar
