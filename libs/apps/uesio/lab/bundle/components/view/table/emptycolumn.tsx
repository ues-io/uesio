import { FC } from "react"
import { component, styles, definition, wire } from "@uesio/ui"

interface T extends definition.BaseProps {
	wire: wire.Wire
	index: number
	isDragging?: boolean
}

const emptyColumn: FC<T> = (props) => {
	const { path = "", index, context, isDragging } = props
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
				<p>Drop a field or component</p>
			)}
		</div>
	)
}

export default emptyColumn
