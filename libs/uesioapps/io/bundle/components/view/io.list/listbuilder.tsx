import { FunctionComponent } from "react"
import { ListProps, ListDefinition } from "./listdefinition"
import List from "./list"
import { hooks, styles } from "@uesio/ui"

const ListBuilder: FunctionComponent<ListProps> = (props) => {
	const uesio = hooks.useUesio(props)
	const definition = uesio.view.useDefinition(props.path) as ListDefinition

	return <List {...props} definition={definition} />
}

export default ListBuilder
