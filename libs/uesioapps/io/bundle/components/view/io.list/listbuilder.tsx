import { FunctionComponent } from "react"
import { ListProps, ListDefinition } from "./listdefinition"
import List from "./list"
import { hooks, styles } from "@uesio/ui"

const ListBuilder: FunctionComponent<ListProps> = (props) => {
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
	const definition = uesio.view.useDefinition(props.path) as ListDefinition

	return (
		<div className={classes.root}>
			<List {...props} definition={definition} />
		</div>
	)
}

export default ListBuilder
