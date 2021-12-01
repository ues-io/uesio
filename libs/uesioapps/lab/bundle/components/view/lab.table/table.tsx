import { FC, useState, useEffect, useRef } from "react"
import { TableProps } from "./tabledefinition"
import { component, styles, hooks, wire } from "@uesio/ui"
import useCellHeight from "./hooks/useCellHeight"
import useScroll from "./hooks/useScroll"
import useColumnDrag from "./hooks/useColumnDrag"
import TableColumn from "../lab.tablecolumn/tablecolumn"
import tableActions from "./actions"
import ActionsBar from "../../utility/lab.actionsbar/actionsbar"

const useFreezePadding = (
	hasFreeze: boolean | undefined,
	columns: HTMLDivElement[]
) => {
	const [sidePadding, setSidePadding] = useState(0)
	useEffect(() => {
		if (!hasFreeze || !columns || !columns[0]) return setSidePadding(0)
		setSidePadding(columns[0].offsetWidth)
	}, [columns.length])

	return `${sidePadding}px`
}

const Table: FC<TableProps> = (props) => {
	const uesio = hooks.useUesio(props)
	const { definition, context, path = "", isDragging } = props

	const wire = uesio.wire.useWire(definition.wire)
	const wireId = wire?.getId()
	const records = wire?.getData() || []

	const columnRefs = useRef<HTMLDivElement[]>([])
	const tableRef = useRef<HTMLDivElement | null>(null)

	const hasScrolled = useScroll(tableRef)
	const tableFreezePadding = useFreezePadding(
		definition.freezeColumn,
		columnRefs.current
	)
	const dragIndicator = useRef<HTMLDivElement>(null)
	const {
		showDragCol,
		setDragCol,
		markerPosition,
		deltaX,
		dragCol,
		dragColWidth,
	} = useColumnDrag(columnRefs.current, tableRef, uesio, path, dragIndicator)

	const [cellHeight, pushCellRef] = useCellHeight(true)
	const [headerCellHeight, pushHeaderCellRef, resizeHeaderCells] =
		useCellHeight()

	const classes = styles.useStyles(
		{
			root: {
				display: "flex",
				flexFlow: "column",
			},
			flexbox: {
				position: "relative",
			},
			tableContainer: {
				overflow: "scroll",
				"&::-webkit-scrollbar": {
					// display: "none",
					// zIndex: 1,
				},
				"&::-webkit-scrollbar-track": {
					display: "none",
					zIndex: 999,
				},
				"&::-webkit-scrollbar-thumb": {
					display: "none",
					zIndex: 999,
				},
			},
			table: {
				overflow: "scroll",
				display: "inline-flex",
				gap: "1px",
				backgroundColor: "#eee",
				border: "1px solid #eee",
				borderRadius: "5px",
			},
			actionsContainer: {
				margin: "1em 0",
			},

			col: {
				flexFlow: "column",
				display: "flex",
				gap: "1px",
				position: "relative",

				"&.scrolled": {
					boxShadow: "9px 0px 13px -12px rgb(0 0 0 / 27%)",
				},
			},
			headerCell: {
				backgroundColor: "#eee",
				padding: "10px",
				span: {
					minHeight: "1.1em",
					display: "block",
				},
			},
			cell: {
				backgroundColor: "#fff",
				display: "flex",
				height: `${cellHeight}px`,
				alignItems: "center",
			},
			cellInner: {},
			dragIndicator: {
				position: "absolute",
				inset: "0 0 0 0",
				backgroundColor: "rgba(0, 0, 0, 0.4)",
				pointerEvents: "none",
			},
		},
		props
	)

	useEffect(() => {
		resizeHeaderCells()
	}, [definition.columns])

	return (
		<div className={classes.root}>
			<div className={classes.flexbox}>
				<div ref={tableRef} className={classes.tableContainer}>
					<div
						style={{ paddingLeft: tableFreezePadding }}
						className={classes.table}
					>
						{
							// columns
							definition.columns.map((x, index) => {
								if (!x) {
									console.log("error")
									return null
								}
								const columnDef = x["lab.tablecolumn"]
								if (!columnDef) return null
								return (
									<TableColumn
										key={null}
										index={index}
										definition={columnDef}
										classes={classes}
										className={`${
											hasScrolled ? "scrolled" : ""
										}`}
										isDragging={isDragging}
										columnRefs={columnRefs}
										path={path}
										setDragCol={
											definition.columns.length > 1
												? setDragCol
												: undefined
										}
										markerPosition={markerPosition}
										tableRef={tableRef}
										context={context}
										wire={wire as wire.Wire}
										dragCol={dragCol}
										freezeColumn={definition.freezeColumn}
										pushHeaderCellRef={pushHeaderCellRef}
										headerCellHeight={headerCellHeight}
										refBox={
											<div
												style={{
													position: "absolute",
													inset: "0 0 0 0",
													pointerEvents: "none",
												}}
												ref={(el) =>
													el &&
													!columnRefs.current.includes(
														el
													) &&
													columnRefs.current.push(el)
												}
											/>
										}
									>
										{/* Rows
								We're seperating the fields from other components */}
										{records.map((record) => {
											if (!columnDef.components)
												return null
											const rowContext = context.addFrame(
												{
													record: record.getId(),
													wire: wireId,
													fieldMode: "READ",
												}
											)

											// eslint-disable-next-line @typescript-eslint/no-explicit-any
											const searchFields = (k: any) =>
												/(io.field)$/.test(
													Object.keys(k)[0]
												)

											const fieldComponentKey =
												columnDef.components.find(
													searchFields
												) as {
													[key: string]: {
														fieldId: string
													}
												}

											return (
												<div
													className={classes.cell}
													key={record.getId()}
													style={{
														alignItems:
															columnDef.verticalAlignment ||
															"center",
													}}
													ref={(el) =>
														el && pushCellRef(el)
													}
												>
													<div
														className={
															classes.cellInner
														}
													>
														{/* Fields */}
														{fieldComponentKey && (
															<component.Component
																componentType="io.field"
																definition={{
																	fieldId:
																		fieldComponentKey[
																			"io.field"
																		]
																			?.fieldId,
																	labelPosition:
																		"none",
																	"uesio.variant":
																		"io.table",
																}}
																path={path}
																context={rowContext.addFrame(
																	{
																		buildMode:
																			false,
																	}
																)}
															/>
														)}

														{/* Components */}
														<component.Slot
															definition={{
																...columnDef,
																components: [
																	...columnDef.components.filter(
																		(
																			// eslint-disable-next-line @typescript-eslint/no-explicit-any
																			k: any
																		) =>
																			Object.keys(
																				k
																			)[0] !==
																			"io.field"
																	),
																],
															}}
															listName="components"
															path={`${path}["columns"]["${index}"]["lab.tablecolumn"]`}
															accepts={[
																"uesio.standalone",
																"uesio.field",
															]}
															context={rowContext}
														/>
													</div>
												</div>
											)
										})}
									</TableColumn>
								)
							})
						}
						{showDragCol && (
							<div
								ref={dragIndicator}
								style={{
									// zIndex: dragCol && dragCol.index ? 10 : 0,
									pointerEvents: "none",
									// opacity: dragCol && dragCol.index === index ? 1 : 0,
									// transform: `translateX(${deltaX}px)`,
									left: `${deltaX}px`,
									top: 0,
									zIndex: 1,
									bottom: 0,
									width: `${dragColWidth}px`,
								}}
								className={classes.dragIndicator}
							/>
						)}
					</div>
				</div>
			</div>

			{/* Table Actions bar */}
			{definition.actions && wire && wireId && (
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
					<ActionsBar
						context={context}
						actions={tableActions(wireId).filter(({ name }) =>
							definition.actions.includes(name)
						)}
						wire={wire}
						definition={definition}
					/>
				</div>
			)}
		</div>
	)
}

export default Table
