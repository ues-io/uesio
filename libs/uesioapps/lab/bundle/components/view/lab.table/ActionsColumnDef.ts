import { TableDefinition } from "./tabledefinition"
import { Action } from "../../utility/lab.actionsbar/actionsbardefinition"
import { TableColumnDefinition } from "../lab.tablecolumn/tablecolumndefinition"

export default (
	definition: TableDefinition,
	actions: Action[]
): { "lab.tablecolumn": TableColumnDefinition } => ({
	"lab.tablecolumn": {
		components: [
			{
				"io.box": {
					components: definition.rowActions.map((rowAction) => {
						const action = actions.find(
							({ name }) => name === rowAction
						)
						return {
							"io.button": {
								...action,
								text: rowAction,
								"uesio.variant":
									definition.rowActionButtonVariant,
							},
						}
					}),
					"uesio.styles": {
						root: {
							padding: "10px",
							display: "flex",
							gap: "5px",
						},
					},
				},
			},
		],
		name: "",
		id: "rowActions", // used for column reaarange logic in the header
	},
})
