import { definition, component, wire } from "@uesio/ui"
import { add, set } from "../../api/defapi"
import { FullPath } from "../../api/path"
import {
	ListProperty as LP,
	ListPropertyAction,
} from "../../properties/componentproperty"

type Definition = {
	// A fully-qualified path to the property
	// If this property is nested within a STRUCT, for instance, it will contain the full path,
	// e.g. "reference->order"
	fieldId?: string
	property: LP
	path: FullPath
}

const ListProperty: definition.UC<Definition> = (props) => {
	const { context, definition } = props
	const { path, property } = definition
	const fieldId = definition.fieldId || property.name
	const itemsDefinition = property.items
	const {
		actions,
		addLabel,
		children,
		defaultDefinition,
		displayTemplate,
		properties,
		sections,
		title,
	} = itemsDefinition || {}

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

	const listPropertyPath = fieldId
		.split("->")
		.reduce((acc, cur) => acc.addLocal(cur), path)
	const items = record.getFieldValue(fieldId) as wire.PlainWireRecord[]
	// If actions are explicitly specified in the definition, use those,
	// otherwise we would expect "addLabel" and "defaultDefinition" to define
	// a single action.
	const createAction = (actionDefinition: ListPropertyAction) => {
		const { label = "Add", defaultDefinition = {} } = actionDefinition
		let { action } = actionDefinition
		if (!action) {
			action = ({ context }) => {
				add(
					context,
					listPropertyPath.addLocal(`${items?.length || 0}`),
					context.mergeStringMap(
						defaultDefinition as unknown as Record<string, string>
					)
				)
			}
		}
		return {
			label,
			action,
		}
	}
	const actionsDef = actions || [
		{
			label: addLabel,
			defaultDefinition,
		},
	]
	const subtype =
		property.subtype ||
		context
			.getWire()
			?.getCollection()
			.getFieldMetadata(fieldId)
			?.getSubType()

	return !itemsDefinition ? (
		<FieldWrapper
			label={property.label}
			labelPosition={"left"}
			context={context}
			variant={"uesio/builder.propfield"}
		>
			{subtype === "CHECKBOX" ||
			subtype === "SELECT" ||
			subtype === "MULTISELECT" ? (
				<MultiSelectField
					fieldId={fieldId}
					path={path}
					value={items || []}
					setValue={(value: wire.FieldValue) => {
						set(context, listPropertyPath, value)
					}}
					mode={"EDIT"}
					context={context}
					options={property?.subtypeOptions}
				/>
			) : (
				<ListField
					fieldId={fieldId}
					path={path}
					value={items}
					setValue={(value: wire.FieldValue) => {
						set(context, listPropertyPath, value)
					}}
					options={{
						labelVariant: "uesio/builder.propfield",
						subFieldVariant: "uesio/builder.propfield",
						subType: subtype,
					}}
					mode={"EDIT"}
					context={context}
				/>
			)}
		</FieldWrapper>
	) : (
		<ListPropertyUtility
			itemProperties={properties}
			itemPropertiesSections={sections}
			itemPropertiesPanelTitle={title}
			itemDisplayTemplate={displayTemplate}
			itemChildren={children}
			actions={actionsDef?.map(createAction)}
			path={listPropertyPath}
			items={items}
			context={context}
		/>
	)
}

export default ListProperty
