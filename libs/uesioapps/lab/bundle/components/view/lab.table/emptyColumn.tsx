import React, { FC } from "react"
import { hooks, styles, definition, wire } from "@uesio/ui"
import FieldHints from "../lab.column/fieldhints"
import { TableDefinition } from "./tabledefinition"

interface T extends definition.BaseProps {
	wire: wire.Wire
	index: number
	tableHasActionsCol: boolean
	// definition: TableDefinition
}

const emptyColumn: FC<T> = (props) => {
	const { path = "", wire, index, tableHasActionsCol } = props
	const classes = styles.useStyles(
		{
			root: {
				backgroundColor: "#fff",
				height: "100%",
				display: "flex",
				alignItems: "center",
				padding: "5px",
				minWidth: "150px",
				justifyContent: "center",
				margin: "1px",
				flex: 1,
			},
		},
		props
	)
	return (
		<div className={classes.root}>
			<FieldHints
				{...props}
				wire={wire}
				// path={`${path}["columns"]["${
				// 	tableHasActionsCol ? index - 1 : index
				// }"]["lab.tablecolumn"]["components"]`}
				path={`${path}["columns"]["${
					index - 1
				}"]["lab.tablecolumn"]["components"]`}
			/>
		</div>
	)
}

export default emptyColumn
