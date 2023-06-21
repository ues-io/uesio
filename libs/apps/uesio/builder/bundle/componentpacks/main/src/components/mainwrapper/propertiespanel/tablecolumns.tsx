import { component, definition } from "@uesio/ui"
import { add, get } from "../../../api/defapi"
import {
	getComponentDef,
	setSelectedPath,
	useSelectedPath,
} from "../../../api/stateapi"
import {
	ComponentProperty,
	FieldMetadataProperty,
	FieldProperty,
} from "../../../properties/componentproperty"

import PropNodeTag from "../../../utilities/propnodetag/propnodetag"
import ItemTag from "../../../utilities/itemtag/itemtag"

type ColumnDefinition = {
	field: string
	label: string
	// reference?: ReferenceFieldOptions
	// user?: UserFieldOptions
	// number?: NumberFieldOptions
	// longtext?: LongTextFieldOptions
	// label: string
	components: definition.DefinitionList
	type?: "" | "custom"
} & definition.BaseDefinition

const columnTypeProperty = {
	name: "type",
	type: "SELECT",
	label: "Column Type",
	options: [
		{ value: "", label: "Field" },
		{ value: "custom", label: "Components" },
	],
	// Populate / remove components array if this field is changed
	onChange: [
		{
			conditions: [
				{
					field: "type",
					value: "custom",
					type: "fieldValue",
				},
			] as component.DisplayCondition[],
			updates: [{ field: "components", value: [] }, { field: "field" }],
		},
		{
			conditions: [
				{
					field: "type",
					value: "",
					type: "fieldValue",
				},
			] as component.DisplayCondition[],
			updates: [{ field: "components" }],
		},
	],
} as ComponentProperty
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

const TABLE_TYPE = "uesio/io.table"

const isCustomColumn = (column: ColumnDefinition) =>
	column?.components?.length > 0 || column?.type === "custom"

const getColumnTitle = (column: ColumnDefinition) => {
	if (isCustomColumn(column)) {
		return "Components" + (column.label ? `: ${column.label}` : "")
	} else {
		return `Field: ${column?.field || '["Not set"]'}`
	}
}

const TableColumns: definition.UC = (props) => {
	const { context } = props

	const ListPropertyUtility = component.getUtility(
		"uesio/builder.listproperty"
	)

	let selectedPath = useSelectedPath(context)
	let localPath
	let tempPath = selectedPath
	// This is a bit of a hack to ensure we're always rendering the TABLE's path, not a nested path
	// eslint-disable-next-line no-constant-condition
	while (true) {
		;[localPath, tempPath] = tempPath.pop()
		if (localPath === TABLE_TYPE) {
			selectedPath = tempPath.addLocal(TABLE_TYPE)
			break
		}
		// If we get to where we have no localPath, add the component type to the original path
		if (!localPath) {
			selectedPath = selectedPath.addLocal(TABLE_TYPE)
			break
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
		if (isCustomColumn(column)) {
			return [columnTypeProperty, widthProperty, labelProperty]
		}
		const ioFieldProperties = (fieldComponentDef?.properties ||
			[]) as ComponentProperty[]

		const fieldProperty = {
			...ioFieldProperties.find((p) => p.name === "fieldId"),
			wireName,
			name: "field",
			label: "Field",
		} as FieldProperty
		delete fieldProperty.wireField

		const fieldDisplayTypeProperty = {
			...ioFieldProperties.find((p) => p.name === "fieldDisplayType"),
			wireName,
			fieldProperty: "field",
		} as FieldMetadataProperty
		delete fieldDisplayTypeProperty.wireProperty

		const tableFieldProperties = [
			columnTypeProperty,
			fieldProperty,
			fieldDisplayTypeProperty,
			widthProperty,
			labelProperty,
		] as ComponentProperty[]

		return tableFieldProperties.concat(ioFieldProperties.slice(5))
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
					<ItemTag context={context}>
						{getComponentType(component)}
					</ItemTag>
				</PropNodeTag>
			)
		})
	}

	const columns = get(context, columnsPath) as definition.DefinitionMap[]

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
							{}
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
