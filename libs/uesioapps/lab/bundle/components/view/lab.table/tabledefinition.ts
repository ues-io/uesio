import { definition, builder, signal, component, wire } from "@uesio/ui"
import { TableColumnDefinition } from "./tablecolumndefinition"
import actionsBarDefinition, {
	ActionsBarDefinition,
} from "../lab.actionsbar/actionsbardefinition"
type TableMode = "READ" | "EDIT"

type TableClasses = Record<
	"root" | "table" | "headerCell" | "header" | "cell" | "row" | "rowDeleted",
	string
>

type TableState = {
	mode: TableMode
}

type TableDefinition = {
	id?: string
	wire: string
	mode: TableMode
	columns: { [key: string]: TableColumnDefinition }[]
	shortName: boolean
	rowActions: string[]
	tableActions: string[]
	tableActionButtonVariant: string
	rowActionButtonVariant: string
	rowActionsColumnPosition: number
	freezeColumn: boolean
}

interface TableProps extends definition.BaseProps {
	definition: TableDefinition & ActionsBarDefinition
	isDragging: boolean
}

type RowAction = {
	text: string
	signals: signal.SignalDefinition[]
}

const rowActions = ["edit", "delete"]

const TablePropertyDefinition: builder.BuildPropertiesDefinition = {
	title: "Table",
	description: "Table",
	link: "https://docs.ues.io/",
	defaultDefinition: () => ({
		id: "NewId",
		mode: "READ",
		columns: [{ "lab.tablecolumn": { name: "your column" } }],
	}),
	properties: [
		{
			name: "id",
			type: "TEXT",
			label: "id",
		},
		{
			name: "wire",
			type: "WIRE",
			label: "wire",
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

		{
			name: "freezeColumn",
			type: "BOOLEAN",
			label: "Freeze",
		},
	],
	sections: [actionsBarDefinition("Table Actions")],
	actions: [
		{
			label: "Add Section",
			type: "ADD",
			componentKey: "lab.tablecolumn",
			slot: "columns",
		},
	],
	accepts: ["uesio.field"],
	traits: ["uesio.standalone"],
	handleFieldDrop: (dragNode, dropNode, dropIndex, propDef, uesio) => {
		const [metadataType, metadataItem] =
			component.path.getFullPathParts(dragNode)
		if (metadataType === "field") {
			const [, , fieldNamespace, fieldName] =
				component.path.parseFieldKey(metadataItem)
			uesio.builder.addDefinition(
				dropNode,
				{
					"io.field": {
						fieldId: `${fieldNamespace}.${fieldName}`,
					},
				},
				dropIndex
			)
		}
	},
	type: "component",
	classes: ["root"],
}
export { TableProps, TableState, TableDefinition, TableClasses, RowAction }

export default TablePropertyDefinition
