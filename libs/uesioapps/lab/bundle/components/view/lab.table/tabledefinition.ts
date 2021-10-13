import { definition, builder, signal, component } from "@uesio/ui"
import { TableColumnDefinition } from "../lab.tablecolumn/tablecolumndefinition"
import actionsBarDefinition, {
	ActionsBarDefinition,
} from "../../utility/lab.actionsbar/actionsbardefinition"
type TableMode = "READ" | "EDIT"

type TableClasses = Record<
	"root" | "table" | "headerCell" | "header" | "cell" | "row" | "rowDeleted",
	string
>

type TableState = {
	mode: TableMode
}

type TableDefinition = {
	id: string
	wire: string
	mode: TableMode
	columns: { [key: string]: TableColumnDefinition }[]
	rowactions: RowAction[]
	shortName: boolean
	fitToContent: boolean
}

interface TableProps extends definition.BaseProps {
	definition: TableDefinition & ActionsBarDefinition
}

type RowAction = {
	text: string
	signals: signal.SignalDefinition[]
}

const TablePropertyDefinition: builder.BuildPropertiesDefinition = {
	title: "Table",
	description: "Table",
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
			name: "fitToContent",
			type: "BOOLEAN",
			label: "Fit to content",
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
