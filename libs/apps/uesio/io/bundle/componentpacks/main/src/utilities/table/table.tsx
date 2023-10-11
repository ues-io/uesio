import { ReactNode } from "react"
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
	isAllSelectedFunc?: () => boolean | undefined
	onSelectChange?: (row: R, index: number, selected: boolean) => void
	onAllSelectChange?: (selected: boolean) => void
	columnHeaderFunc: (column: C) => ReactNode
	columnMenuFunc?: (column: C) => ReactNode
	cellFunc: (column: C, row: R, columnIndex: number) => ReactNode
	rowNumberFunc?: (index: number) => string
	defaultActionFunc?: (row: R) => void
	rowActionsFunc?: (row: R) => ReactNode
}

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
		columnHeaderFunc,
		columnMenuFunc,
		isDeletedFunc,
		cellFunc,
		context,
	} = props
	const classes = styles.useUtilityStyleTokens(
		{
			root: [],
			table: [],
			header: [],
			headerCell: [],
			headerCellInner: [],
			rowNumberCell: [],
			rowNumber: [],
			cell: [],
			body: [],
			row: ["group"],
			rowDeleted: [],
			noData: [],
		},
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
							<tr
								onClick={
									defaultActionFunc
										? () => defaultActionFunc(row)
										: undefined
								}
								className={styles.cx(
									classes.row,
									isDeletedFunc?.(row) && classes.rowDeleted
								)}
								key={index + 1}
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
