import { definition, component, wire } from "@uesio/ui"
import { add } from "../../api/defapi"
import { FullPath } from "../../api/path"
import { ListProperty } from "../../properties/componentproperty"

type Definition = {
	property: ListProperty
	path: FullPath
}

const ListProperty: definition.UC<Definition> = (props) => {
	const { context, definition } = props
	const { path, property } = definition
	const itemsDefinition = property.items

	const ListPropertyUtility = component.getUtility(
		"uesio/builder.listproperty"
	)

	const viewDefId = context.getViewDefId() || ""
	const record = context.getRecord()

	if (!viewDefId || !record) return null

	const listPropertyPath = path.addLocal(property.name)
	const items = record.getFieldValue(property.name) as wire.PlainWireRecord[]

	return (
		<ListPropertyUtility
			itemProperties={itemsDefinition?.properties}
			itemPropertiesSections={itemsDefinition?.sections}
			itemPropertiesPanelTitle={itemsDefinition?.title}
			itemDisplayTemplate={itemsDefinition?.displayTemplate}
			addLabel={itemsDefinition?.addLabel}
			path={listPropertyPath}
			items={items}
			context={context}
			addAction={() => {
				add(
					context,
					listPropertyPath.addLocal(`${items?.length || 0}`),
					itemsDefinition?.defaultDefinition || {}
				)
			}}
		/>
	)
}

export default ListProperty
