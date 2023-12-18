import { Fragment, ReactNode } from "react"
import { definition, styles } from "@uesio/ui"
import CheckboxField from "../field/checkbox"

interface TableColumn {
	width?: string
}

interface TableUtilityProps<R, C extends TableColumn> {
	rows: R[]
	columns: C[]
	isDeletedFunc?: (row: R) => boolean
	isSelectedFunc?: (row: R, index: number) => boolean
	isRowExpandedFunc?: (row: R) => boolean
	isAllSelectedFunc?: () => boolean | undefined
	onSelectChange?: (row: R, index: number, selected: boolean) => void
	onAllSelectChange?: (selected: boolean) => void
	columnHeaderFunc: (column: C) => ReactNode
	columnMenuFunc?: (column: C) => ReactNode
	cellFunc: (column: C, row: R, columnIndex: number) => ReactNode
	rowNumberFunc?: (index: number) => string
	defaultActionFunc?: (row: R) => void
	rowActionsFunc?: (row: R) => ReactNode
	drawerRendererFunc?: (row: R) => ReactNode
	rowKeyFunc: (row: R) => string
}

const StyleDefaults = Object.freeze({
	root: [],
	table: [],
	drawer: [],
	header: [],
	headerCell: [],
	headerCellInner: [],
	rowNumberCell: [],
	rowNumber: [],
	cell: [],
	body: [],
	row: ["group"],
	rowDeleted: [],
	rowExpanded: [],
	noData: [],
})

const Table: definition.UtilityComponent<
	TableUtilityProps<unknown, TableColumn>
> = (props) => {
	const {
		id,
		columns,
		rows,
		rowNumberFunc,
		isSelectedFunc,
		isAllSelectedFunc,
		onSelectChange,
		onAllSelectChange,
		defaultActionFunc,
		rowActionsFunc,
		drawerRendererFunc,
		isRowExpandedFunc,
		columnHeaderFunc,
		columnMenuFunc,
		isDeletedFunc,
		cellFunc,
		rowKeyFunc,
		context,
	} = props
	const classes = styles.useUtilityStyleTokens(
		StyleDefaults,
		props,
		"uesio/io.table"
	)

	const getRowNumberHeaderCell = () => {
		if (isAllSelectedFunc && onAllSelectChange) {
			const isSelected = isAllSelectedFunc()
			return (
				<CheckboxField
					context={context}
					value={isSelected}
					setValue={(value: boolean) => onAllSelectChange(value)}
					mode="EDIT"
				/>
			)
		}
	}

	const getRowNumberCell = (
		row: unknown,
		index: number,
		isSelected: boolean
	) => {
		if (onSelectChange) {
			return (
				<>
					<div className="numberlabel">
						{rowNumberFunc?.(index + 1)}
					</div>
					<CheckboxField
						className="numbercheck"
						context={context}
						value={isSelected}
						setValue={(value: boolean) =>
							onSelectChange(row, index, value)
						}
						mode="EDIT"
					/>
				</>
			)
		}
		return rowNumberFunc?.(index + 1)
	}

	const getDrawer =
		drawerRendererFunc && isRowExpandedFunc
			? (row: unknown) =>
					isRowExpandedFunc(row) && (
						<tr className={styles.cx(classes.row)}>
							<td colSpan={1000} className={classes.drawer}>
								{drawerRendererFunc(row)}
							</td>
						</tr>
					)
			: undefined

	return (
		<div className={classes.root}>
			<table id={id} className={classes.table}>
				<thead className={classes.header}>
					<tr>
						{(rowNumberFunc || isSelectedFunc) && (
							<th
								className={styles.cx(
									classes.headerCell,
									classes.rowNumberCell
								)}
								key="rownumbers"
							>
								{getRowNumberHeaderCell()}
							</th>
						)}
						{columns?.map((column, index) => (
							<th
								key={index}
								className={classes.headerCell}
								style={{ width: column?.width }}
							>
								<div className={classes.headerCellInner}>
									{columnHeaderFunc(column)}
									{columnMenuFunc && columnMenuFunc(column)}
								</div>
							</th>
						))}
						{rowActionsFunc && (
							<th
								className={classes.headerCell}
								key="rowactions"
							/>
						)}
					</tr>
				</thead>
				<tbody
					className={styles.cx(
						classes.body,
						defaultActionFunc && "hasRowAction"
					)}
				>
					{rows.map((row, index) => {
						const isSelected = isSelectedFunc?.(row, index) || false
						return (
							<Fragment key={rowKeyFunc(row)}>
								<tr
									onClick={
										defaultActionFunc
											? () => defaultActionFunc(row)
											: undefined
									}
									className={styles.cx(
										classes.row,
										isRowExpandedFunc?.(row) &&
											classes.rowExpanded,
										isDeletedFunc?.(row) &&
											classes.rowDeleted
									)}
								>
									{(rowNumberFunc || isSelectedFunc) && (
										<td
											className={styles.cx(
												classes.cell,
												classes.rowNumberCell,
												isSelected && "isselected"
											)}
											key="rownumbers"
										>
											{getRowNumberCell(
												row,
												index,
												isSelected
											)}
										</td>
									)}
									{columns.map((column, i) => (
										<td key={i} className={classes.cell}>
											{cellFunc(column, row, i)}
										</td>
									))}
									{rowActionsFunc && (
										<td
											key="rowactions"
											className={classes.cell}
										>
											{rowActionsFunc(row)}
										</td>
									)}
								</tr>
								{getDrawer?.(row)}
							</Fragment>
						)
					})}
				</tbody>
			</table>
			{(!rows || rows.length < 1) && (
				<div className={classes.noData}>
					{context.getLabel("uesio/io.no_data_available")}
				</div>
			)}
		</div>
	)
}

export default Table
