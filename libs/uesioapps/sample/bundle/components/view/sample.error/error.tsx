import { FunctionComponent } from "react"
import { ErrorProps } from "./errordefinition"
import { styles } from "@uesio/ui"
import { Button } from "@material-ui/core"

const Error: FunctionComponent<ErrorProps> = (props) => {
	const classes = styles.useStyles(
		{
			root: {
				padding: "100px",
				backgroundColor: props.definition.color || "#2D72D9",
				height: "100%",
				textAlign: "center",
			},
			h1: {
				fontSize: "220px",
				color: props.definition.fontColor || "white",
			},
			p: {
				color: props.definition.fontColor || "white",
			},
		},
		props
	)
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
