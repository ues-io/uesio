import { FC, useState, useEffect, useRef, useMemo } from "react"
import { TableProps } from "./tabledefinition"
import { component, styles, hooks } from "@uesio/ui"
import TableHeader from "./tableheader"
const LabLayout = component.registry.getUtility("lab.layout")

const Table: FC<TableProps> = (props) => {
	const uesio = hooks.useUesio(props)
	const { definition, context, path = "" } = props
	const wire = uesio.wire.useWire(definition.wire)

	const viewDefId = uesio.getViewDefId() || ""

	const classes = styles.useStyles(
		{
			root: {
				position: "relative",
			},
			tableContainer: {},

			column: {
				flex: 1,
				position: "relative",
				padding: "10px",
				backgroundColor: "#eee",
				"&.hint": {
					flex: "initial",
				},
			},
			dragIndicator: {
				position: "absolute",
				inset: "0 0 0 0",
				backgroundColor: "rgba(0, 0, 0, 0.25)",
			},
		},
		props
	)
	const records = wire?.getData() || []

	// ===

	return (
		<div className={classes.root}>
			<div className={classes.tableContainer}>
				{/* Header Row */}

				{wire && (
					<TableHeader
						wire={wire}
						classes={classes}
						definition={definition}
						context={context}
						path={path}
					/>
				)}

				{/* Data Rows */}
				{records.map((record, index) => {
					const rowContext = context.addFrame({
						record: record.getId(),
						wire: wire?.getId() || "",
						fieldMode: "READ",
					})

					return (
						<LabLayout
							key={record.getId()}
							classes={classes}
							context={props.context}
						>
							<component.Slot
								definition={definition}
								listName="columns"
								path={path}
								accepts={["uesio.tablecolumn"]}
								context={rowContext}
							/>

							{/* {definition.columns.map((column, index) => {
							console.log({ column })
							return (
								// <div className={classes.column}>
								<component.Slot
									definition={column}
									listName="columns"
									path={path}
									accepts={["uesio.tablecolumn"]}
									context={rowContext}
								/>
								// </div>
							)
						})} */}
						</LabLayout>
					)
				})}
			</div>
		</div>
	)
}

export default Table
