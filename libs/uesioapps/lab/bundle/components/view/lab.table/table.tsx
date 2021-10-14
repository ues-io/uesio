import { FC, useState, useEffect, useRef } from "react"
import { TableProps } from "./tabledefinition"
import { component, styles, hooks } from "@uesio/ui"
import TableHeader from "./tableheader"
import { TableColumnDefinition } from "../lab.tablecolumn/tablecolumndefinition"
import Col from "./col"
import actions from "./actions"

const LabLayout = component.registry.getUtility("lab.layout")
const LabActionsBar = component.registry.getUtility("lab.actionsbar")

const Table: FC<TableProps> = (props) => {
	const uesio = hooks.useUesio(props)
	const { definition, context, path = "" } = props
	const wire = uesio.wire.useWire(definition.wire)
	const wireId = wire?.getId()
	const columnRefs = useRef<HTMLDivElement[]>([])

	const [metadataType, metadataItem, selectedPath] =
		uesio.builder.useSelectedNode()

	const { tableActions, rowActions } = actions(wireId || "")

	const classes = styles.useStyles(
		{
			root: {
				position: "relative",
				display: "flex",
			},
			tableContainer: {
				display: "flex",
				gap: "1px",
				backgroundColor: "#eee",
			},
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
			col: {
				flex: 1,
				flexFlow: "column",
				display: "flex",
				gap: "1px",
				position: "relative",
			},
			headerCell: {
				backgroundColor: "#eee",
				padding: "10px",
			},
			cell: {
				backgroundColor: "#fff",
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

	const getColumnLabel = (column: TableColumnDefinition): string => {
		if (!wire) return ""
		const collection = wire.getCollection()

		if (!collection) return ""
		// Find the first component ending with '.field'
		const field = column.components.find((c: any) => {
			const componentName = Object.keys(c)[0]
			return /(io.field)$/.test(componentName)
		}) as {
			"io.field": {
				fieldId: string
			}
		}
		if (!field) return ""
		return collection.getField(field["io.field"]?.fieldId)?.getLabel() || ""
	}
	console.log("mounted")
	const [markerPosition, setMarkerPosition] = useState<number | null>(null)

	return (
		<div className={classes.root} style={{ flexFlow: "column" }}>
			<div className={classes.tableContainer}>
				{/* Header Row */}
				{/* {wire && (
					<TableHeader
						wire={wire}
						classes={classes}
						definition={def}
						context={context}
						path={path}
					/>
				)} */}

				{
					// columns
					definition.columns.map((x, index) => {
						const columnDef = x["lab.tablecolumn"]
						return (
							<Col
								index={index}
								definition={definition}
								classes={classes}
								columnRefs={columnRefs}
								path={path}
								markerPosition={markerPosition}
								setMarkerPosition={setMarkerPosition}
							>
								<div
									style={{
										position: "absolute",
										inset: "0 0 0 0",
									}}
									ref={(el) =>
										el &&
										!columnRefs.current.includes(el) &&
										columnRefs.current.push(el)
									}
								/>
								<div className={classes.headerCell}>
									{columnDef.name ||
										getColumnLabel(columnDef)}
								</div>
								{/* Rows */}
								{records.map((record, index) => {
									const rowContext = context.addFrame({
										record: record.getId(),
										wire: wireId,
										fieldMode: "READ",
									})

									const searchFields = (k: any) =>
										/(io.field)$/.test(Object.keys(k)[0])

									const fieldComponentKey =
										columnDef.components.find(
											searchFields
										) as {
											[key: string]: {
												fieldId: string
											}
										}
									const newDefinition = {
										...columnDef,
										components: [
											...columnDef.components.filter(
												(k: any) =>
													Object.keys(k)[0] !==
													"io.field"
											),
										],
									}

									return (
										<div
											className={classes.cell}
											key={record.getId()}
										>
											{fieldComponentKey && (
												<component.Component
													componentType="io.field"
													definition={{
														fieldId:
															fieldComponentKey[
																"io.field"
															]?.fieldId,
														hideLabel: true,
														"uesio.variant":
															"io.table",
													}}
													path={path}
													context={rowContext.addFrame(
														{
															buildMode: false,
														}
													)}
												/>
											)}

											<component.Slot
												definition={newDefinition}
												listName="components"
												path={path}
												accepts={[
													"uesio.standalone",
													"uesio.field",
												]}
												context={rowContext}
											/>
										</div>
									)
								})}
							</Col>
						)
						// /////
					})
				}

				{/* Data Rows */}
			</div>

			{/* Table Actions bar */}
			{/* {definition.actions && (
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
			)} */}
		</div>
	)
}

export default Table
