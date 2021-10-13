import { FC } from "react"
import { TableProps } from "./tabledefinition"
import { component, styles, hooks } from "@uesio/ui"
import TableHeader from "./tableheader"

import actions from "./actions"

const LabLayout = component.registry.getUtility("lab.layout")
const LabActionsBar = component.registry.getUtility("lab.actionsbar")

const Table: FC<TableProps> = (props) => {
	const uesio = hooks.useUesio(props)
	const { definition, context, path = "" } = props
	const wire = uesio.wire.useWire(definition.wire)
	const wireId = wire?.getId()

	const { tableActions, rowActions } = actions(wireId || "")

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

	// We want a way to add a column with rowactions
	// based on the row actions section of the table definition
	const getTableColumns = () => {
		const showActionsColumn =
			definition.rowActions.length &&
			definition.rowActionsColumnPosition !== undefined

		if (!showActionsColumn) return definition.columns

		const rowActionsColumnDef = {
			"lab.tablecolumn": {
				components: definition.rowActions.map((rowAction) => {
					const action = rowActions.find(
						({ name }) => name === rowAction
					)
					return {
						"io.button": {
							...action,
							text: rowAction,
							"uesio.variant": definition.rowActionButtonVariant,
						},
					}
				}),
				name: "",
				id: "rowActions", // used for column reaarange logic in the header
				"uesio.styles": {
					root: {
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
						flexFlow: "row wrap",
						margin: "0 auto",
						gap: "5px",
					},
				},
			},
		}

		// inject the actions column at the desired position
		const position = definition.rowActionsColumnPosition - 1
		return [
			...definition.columns.slice(0, position),
			rowActionsColumnDef,
			...definition.columns.slice(position),
		]
	}

	const def = {
		...definition,
		columns: getTableColumns(),
	}

	return (
		<div className={classes.root} style={{ flexFlow: "column" }}>
			<div className={classes.tableContainer}>
				{/* Header Row */}
				{wire && (
					<TableHeader
						wire={wire}
						classes={classes}
						definition={def}
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
								definition={def}
								listName="columns"
								path={path}
								accepts={["uesio.tablecolumn"]}
								context={rowContext}
							/>
						</LabLayout>
					)
				})}
			</div>

			{/* Table Actions bar */}
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
						actions={tableActions.filter(({ name }) =>
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
