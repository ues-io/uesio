import { FC } from "react"
import { component, styles, definition, wire } from "@uesio/ui"
import FieldHints from "../lab.column/fieldhints"

interface T extends definition.BaseProps {
	wire: wire.Wire
	index: number
	isDragging?: boolean
}

const emptyColumn: FC<T> = (props) => {
	const { path = "", wire, index, context, isDragging, definition } = props
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
				flex: 1,
			},
		},
		props
	)

	return (
		<div className={classes.root}>
			{isDragging ? (
				<component.Slot
					definition={{}}
					listName="components"
					path={`${path}["columns"]["${index}"]["lab.tablecolumn"]`}
					accepts={["uesio.standalone", "uesio.field"]}
					context={context}
				/>
			) : (
				<FieldHints
					{...props}
					wire={wire}
					path={`${path}["columns"]["${index}"]["lab.tablecolumn"]["components"]`}
				/>
			)}
		</div>
	)
}

export default emptyColumn
