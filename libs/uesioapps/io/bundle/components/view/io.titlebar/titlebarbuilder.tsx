import { FunctionComponent } from "react"
import { TitleBarProps, TitleBarDefinition } from "./titlebardefinition"
import TitleBar from "./titlebar"
import { hooks, styles } from "@uesio/ui"

const TitleBarBuilder: FunctionComponent<TitleBarProps> = (props) => {
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
	const definition = uesio.view.useDefinition(
		props.path
	) as TitleBarDefinition

	return (
		<div className={classes.root}>
			<TitleBar {...props} definition={definition} />
		</div>
	)
}

export default TitleBarBuilder
