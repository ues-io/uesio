import { definition, component, wire } from "@uesio/ui"
import { add } from "../../api/defapi"
import { FullPath } from "../../api/path"
import { ListProperty as LP } from "../../properties/componentproperty"

type Definition = {
	property: LP
	path: FullPath
}

const ListProperty: definition.UC<Definition> = (props) => {
	const { context, definition } = props
	const { path, property } = definition
	const itemsDefinition = property.items

	if (!component.shouldAll(property?.displayConditions, context)) return null

	const ListPropertyUtility = component.getUtility(
		"uesio/builder.listproperty"
	)

	const viewDefId = context.getViewDefId() || ""
	const record = context.getRecord()

	if (!viewDefId || !record) return null

	const listPropertyPath = path.addLocal(property.name)
	const items = record.getFieldValue(property.name) as wire.PlainWireRecord[]
	const actions = [
		{
			label: itemsDefinition?.addLabel || "Add",
			action: () => {
				add(
					context,
					listPropertyPath.addLocal(`${items?.length || 0}`),
					itemsDefinition?.defaultDefinition || {}
				)
			},
		},
	]

	return (
		<ListPropertyUtility
			itemProperties={itemsDefinition?.properties}
			itemPropertiesSections={itemsDefinition?.sections}
			itemPropertiesPanelTitle={itemsDefinition?.title}
			itemDisplayTemplate={itemsDefinition?.displayTemplate}
			actions={actions}
			path={listPropertyPath}
			items={items}
			context={context}
		/>
	)
}

export default ListProperty
