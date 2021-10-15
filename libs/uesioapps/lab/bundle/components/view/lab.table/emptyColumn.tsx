import React, { FC } from "react"
import { hooks, styles, definition, wire } from "@uesio/ui"
import FieldHints from "../lab.column/fieldhints"

interface T extends definition.BaseProps {
	wire: wire.Wire
	index: number
}

const emptyColumn: FC<T> = (props) => {
	const { path = "", definition, wire, index } = props
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
			},
		},
		props
	)
	const includesActionsCol = false
	return (
		<div className={classes.root}>
			<FieldHints
				{...props}
				wire={wire}
				path={`${path}["columns"]["${
					includesActionsCol ? index - 1 : index
				}"]["lab.tablecolumn"]["components"]`}
			/>
		</div>
	)
}

export default emptyColumn
