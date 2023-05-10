import { definition, component, wire } from "@uesio/ui"
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
	const ListField = component.getUtility("uesio/io.listfield")
	const MultiSelectField = component.getUtility("uesio/io.multiselectfield")
	const FieldWrapper = component.getUtility("uesio/io.fieldwrapper")

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

	return !itemsDefinition ? (
		<FieldWrapper
			label={property.label}
			labelPosition={"left"}
			context={context}
			variant={"uesio/builder.propfield"}
		>
			{property.subtype === "CHECKBOX" ||
			property.subtype === "SELECT" ||
			property.subtype === "MULTISELECT" ? (
				<MultiSelectField
					fieldId={property.name}
					path={path}
					value={items || []}
					subType={property.subtype}
					setValue={(value: wire.FieldValue) => {
						set(context, listPropertyPath, value)
					}}
					mode={"EDIT"}
					context={context}
					labelVariant={"uesio/builder.propfield"}
					subFieldVariant={"uesio/builder.propfield"}
					options={property?.subtypeOptions}
				/>
			) : (
				<ListField
					fieldId={property.name}
					path={path}
					value={items}
					subType={property.subtype}
					setValue={(value: wire.FieldValue) => {
						set(context, listPropertyPath, value)
					}}
					mode={"EDIT"}
					context={context}
					labelVariant={"uesio/builder.propfield"}
					subFieldVariant={"uesio/builder.propfield"}
				/>
			)}
		</FieldWrapper>
	) : (
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
