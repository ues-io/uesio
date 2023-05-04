import { definition, component, wire, collection } from "@uesio/ui"
import { add, set } from "../../api/defapi"
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
	const Field = component.getUtility("uesio/io.field")

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

	return !itemsDefinition?.subtype ? (
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
	) : (
		<Field
			key={"values"}
			//fieldId={subfieldId}
			// TODO: If we need to use real wire records here, we'll need to convert item into a WireRecord
			record={{} as wire.WireRecord}
			path={listPropertyPath}
			labelPosition={"top"}
			fieldMetadata={
				new collection.Field({
					name: "values",
					namespace: "",
					type: "LIST",
					subtype: itemsDefinition.subtype,
					createable: true,
					accessible: true,
					updateable: true,
					label: "Values",
				})
			}
			value={items}
			mode={"EDIT"}
			context={context}
			//variant={subFieldVariant}
			setValue={(value: wire.FieldValue) => {
				set(context, listPropertyPath, value)
			}}
		/>
	)
}

export default ListProperty
