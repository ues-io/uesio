import { FunctionComponent } from "react"
import { ErrorProps } from "./errordefinition"
import { styles, component } from "@uesio/ui"

const Button = component.registry.getUtility("io.button")

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
				variant="io.secondary"
				label={props.definition.url}
				context={props.context}
			/>
		</div>
	)
}

export default Error
