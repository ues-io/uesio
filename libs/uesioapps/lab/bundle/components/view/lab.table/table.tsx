import { FC, useState, useEffect, useRef, useMemo } from "react"
import { TableProps } from "./tabledefinition"
import { component, styles, hooks } from "@uesio/ui"
import { Action } from "../../utility/lab.actionsbar/actionsbardefinition"
import TableHeader from "./tableheader"

const LabLayout = component.registry.getUtility("lab.layout")
const LabActionsBar = component.registry.getUtility("lab.actionsbar")

const Table: FC<TableProps> = (props) => {
	const uesio = hooks.useUesio(props)
	const { definition, context, path = "" } = props
	const wire = uesio.wire.useWire(definition.wire)
	const wireId = wire?.getId()
	const viewDefId = uesio.getViewDefId() || ""

	const classes = styles.useStyles(
		{
			root: {
				position: "relative",
				display: "flex",
			},
			tableContainer: {},
			actionsContainer: {
				margin: "1em 0",
			},

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
				zIndex: 1,
				pointerEvents: "none",
			},
		},
		props
	)
	const records = wire?.getData() || []

	const actions: Action[] = [
		{
			name: "save",
			signals: [
				{ signal: "wire/SAVE", wires: [wireId] },
				{
					signal: "notification/ADD",
					text: "saved",
				},
				{ signal: "wire/EMPTY", wireId },
				{ signal: "wire/CREATE_RECORD", wireId },
			],
		},
		{
			name: "cancel",
			signals: [{ signal: "wire/CANCEL", wireId }],
		},
		{
			name: "delete",
			signals: [
				{ signal: "wire/MARK_FOR_DELETE", wireId },
				{ signal: "wire/SAVE", wireId },
			],
		},
	]

	return (
		<div className={classes.root} style={{ flexFlow: "column" }}>
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
						wire: wireId,
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

			{/* Actions bar */}
			{definition.actions && (
				<div
					className={classes.actionsContainer}
					style={{
						textAlign: definition.actionsBarAlignment,
						order:
							definition.actionsBarPosition === "top"
								? -1
								: "initial",
					}}
				>
					<LabActionsBar
						context={context}
						actions={actions.filter(({ name }) =>
							definition.actions.includes(name)
						)}
						definition={definition}
					/>
				</div>
			)}
		</div>
	)
}

export default Table
