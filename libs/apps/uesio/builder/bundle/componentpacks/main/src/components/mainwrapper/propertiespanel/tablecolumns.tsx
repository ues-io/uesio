import { component, definition } from "@uesio/ui"
import { add, get } from "../../../api/defapi"
import {
	getComponentDef,
	setSelectedPath,
	useSelectedPath,
} from "../../../api/stateapi"
import { ComponentProperty } from "../../../properties/componentproperty"

import PropNodeTag from "../../../utilities/propnodetag/propnodetag"

type ColumnDefinition = {
	field: string
	label: string
	// reference?: ReferenceFieldOptions
	// user?: UserFieldOptions
	// number?: NumberFieldOptions
	// longtext?: LongTextFieldOptions
	// label: string
	components: definition.DefinitionList
} & definition.BaseDefinition

const labelProperty = {
	name: "label",
	type: "TEXT",
	label: "Column Label",
}
const widthProperty = {
	name: "width",
	type: "TEXT",
	label: "Column Width",
}

const TableColumns: definition.UC = (props) => {
	const { context } = props

	const ListPropertyUtility = component.getUtility(
		"uesio/builder.listproperty"
	)

	let selectedPath = useSelectedPath(context)
	let localPath, tempPath
	// This is a bit of a hack to ensure we're always rendering the TABLE's path, not a nested path
	// eslint-disable-next-line no-constant-condition
	while (true) {
		;[localPath, tempPath] = selectedPath.pop()
		if (localPath === "uesio/io.table") {
			break
		} else {
			selectedPath = tempPath
		}
	}

	const columnsPath = selectedPath.addLocal("columns")

	// Get wire name from parent table,
	// in order to build a FIELD property that only shows fields from that wire
	const [, tablePath] = columnsPath.pop()
	const wireName = get(context, tablePath.addLocal("wire")) as string
	const fieldComponentDef = getComponentDef(context, "uesio/io.field")

	const getComponentType = (def: definition.DefinitionMap): string =>
		Object.keys(def)[0] as string

	const getColumnProperties = (column: ColumnDefinition) => {
		// If the column has components, then the individual components can be edited through their child components,
		// but we still want to specify COLUMN properties
		if (column?.components?.length > 0) {
			return [widthProperty, labelProperty]
		}
		const fieldId = {
			name: "field",
			label: "Field",
			required: true,
			type: "FIELD",
			wireName,
		} as ComponentProperty
		const fieldProperties = (fieldComponentDef?.properties ||
			[]) as ComponentProperty[]
		// This is a bit of a hack --- have to remove the "field" property from io field, which is normally readonly text,
		// so that we can render it here as an editable FIELD type with a wire
		return [fieldId, widthProperty].concat(
			fieldProperties.filter((p) => p.name !== "fieldId")
		)
	}

	const getColumnTitle = (column: ColumnDefinition) => {
		if (column?.components?.length > 0) {
			return "Components" + (column.label ? `: ${column.label}` : "")
		} else {
			return `Field: ${column?.field || '["Not set"]'}`
		}
	}

	const getItemChildren = (column: ColumnDefinition, itemIndex: number) => {
		if (!column?.components?.length) return null
		const columnPath = columnsPath.addLocal(`${itemIndex}`)
		const columnComponentsPath = columnPath.addLocal("components")
		return column.components.map((component, cmpIdx) => {
			const itemPath = columnComponentsPath.addLocal(`${cmpIdx}`)
			return (
				<PropNodeTag
					key={itemIndex}
					onClick={(e: MouseEvent) => {
						e.stopPropagation()
						setSelectedPath(context, itemPath)
					}}
					selected={selectedPath.startsWith(itemPath)}
					context={context}
				>
					<div className="tagroot">{getComponentType(component)}</div>
				</PropNodeTag>
			)
		})
	}

	const columns = get(context, columnsPath) as definition.DefinitionMap[]

	const defaultColumnDef = {}

	return (
		<ListPropertyUtility
			context={context}
			path={columnsPath}
			actions={[
				{
					label: "Add Column",
					action: () => {
						add(
							context,
							columnsPath.addLocal(`${columns?.length || 0}`),
							defaultColumnDef
						)
					},
				},
			]}
			items={columns}
			itemProperties={getColumnProperties}
			itemDisplayTemplate={getColumnTitle}
			itemPropertiesPanelTitle="Column Properties"
			itemChildren={getItemChildren}
		/>
	)
}

TableColumns.displayName = "TableColumns"

export default TableColumns
