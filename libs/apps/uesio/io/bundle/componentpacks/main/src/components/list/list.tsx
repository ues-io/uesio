import { api, component, signal, definition, context } from "@uesio/ui"

import {
	setEditMode,
	setReadMode,
	toggleMode,
	useMode,
} from "../../shared/mode"

type ListDefinition = {
	id?: string
	wire?: string
	mode?: context.FieldMode
	components?: definition.DefinitionList
}

const signals: Record<string, signal.ComponentSignalDescriptor> = {
	TOGGLE_MODE: toggleMode,
	SET_READ_MODE: setReadMode,
	SET_EDIT_MODE: setEditMode,
}

const List: definition.UC<ListDefinition> = (props) => {
	const { path, context, definition } = props
	const wire = api.wire.useWire(definition.wire, context)

	const componentId = api.component.getComponentIdFromProps(props)
	const [mode] = useMode(componentId, definition.mode)

	if (!wire || !mode) return null

	return (
		<>
			{wire.getData().map((record, i) => (
				<component.Slot
					key={record.getId() || i}
					definition={definition}
					listName="components"
					path={path}
					context={context
						.addRecordFrame({
							wire: wire.getId(),
							record: record.getId(),
							view: wire.getViewId(),
						})
						.addFieldModeFrame(mode)}
				/>
			))}
		</>
	)
}

/*
const ListPropertyDefinition: builder.BuildPropertiesDefinition = {
	title: "List",
	description:
		"Iterate over records in a wire and render content in the context of each record.",
	link: "https://docs.ues.io/",
	defaultDefinition: () => ({ id: "NewId", mode: "READ" }),
	properties: [
		{
			name: "id",
			type: "TEXT",
			label: "id",
		},
		{
			name: "wire",
			type: "WIRE",
			label: "Wire",
		},
		{
			name: "mode",
			type: "SELECT",
			label: "Mode",
			options: [
				{
					value: "READ",
					label: "Read",
				},
				{
					value: "EDIT",
					label: "Edit",
				},
			],
		},
	],
	handleFieldDrop: (dragNode, dropNode, dropIndex) => {
		const [metadataType, metadataItem] =
			component.path.getFullPathParts(dragNode)

		if (metadataType === "field") {
			const [, , fieldNamespace, fieldName] =
				component.path.parseFieldKey(metadataItem)
			uesio.builder.addDefinition(
				dropNode,
				{
					"uesio/io.field": {
						fieldId: `${fieldNamespace}.${fieldName}`,
					},
				},
				dropIndex
			)
		}
	},
	sections: [],
	actions: [],
	traits: ["uesio.standalone"],
	type: "component",
	classes: ["root"],
	category: "DATA",
}
*/

export { ListDefinition }

List.signals = signals
export default List
