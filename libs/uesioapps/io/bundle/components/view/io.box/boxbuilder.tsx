import { FunctionComponent } from "react"
import { BoxProps, BoxDefinition } from "./boxdefinition"
import Box from "./box"
import { hooks, styles } from "@uesio/ui"

const BoxBuilder: FunctionComponent<BoxProps> = (props) => {
	const classes = styles.useStyles(
		{
			root: {
				pointerEvents: "none",
			},
		},
		{
			context: props.context,
		}
	)

	const uesio = hooks.useUesio(props)
	const definition = uesio.view.useDefinition(props.path) as BoxDefinition

	return (
		<div className={classes.root}>
			<Box {...props} definition={definition} />
		</div>
	)
}

export default BoxBuilder
