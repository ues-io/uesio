import { api, wire, definition } from "@uesio/ui"
import { default as DynamicListUtility } from "../../utilities/dynamiclist/dynamiclist"

type Props = {
	fields: Record<string, wire.ViewOnlyField>
	content: definition.DefinitionList
}

const DynamicList: definition.UC<Props> = (props) => {
	const { definition, context, path } = props

	return (
		<DynamicListUtility
			id={api.component.getComponentIdFromProps(props)}
			path={path}
			context={context}
			fields={definition.fields}
			content={definition.content}
		/>
	)
}

export default DynamicList
