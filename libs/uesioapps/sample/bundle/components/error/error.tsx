import React, { FunctionComponent } from "react"
import { ErrorProps } from "./errordefinition"
import { styles } from "@uesio/ui"
import { Button } from "@material-ui/core"

const useStyles = styles.getUseStyles(["root", "h1", "p"], {
	root: (props: ErrorProps) => ({
		padding: "100px",
		backgroundColor: props.definition.color || "#2D72D9",
		height: "100%",
		textAlign: "center",
	}),
	h1: (props: ErrorProps) => ({
		fontSize: "220px",
		color: props.definition.fontColor || "white",
	}),
	p: (props: ErrorProps) => ({
		color: props.definition.fontColor || "white",
	}),
})

const Error: FunctionComponent<ErrorProps> = (props) => {
	const classes = useStyles(props)
	return (
		<div className={classes.root}>
			<h1 className={classes.h1}>{props.definition.message}</h1>
			<p className={classes.p}> {props.definition.subMessage}</p>
			<Button
				color="primary"
				variant="contained"
				href={props.definition.url}
			>
				{props.definition.url}
			</Button>
		</div>
	)
}

export default Error
