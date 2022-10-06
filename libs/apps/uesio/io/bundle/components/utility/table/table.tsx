import { FunctionComponent, ReactNode } from "react"
import { definition, styles } from "@uesio/ui"

interface TableUtilityProps<R, C> extends definition.UtilityProps {
	rows: R[]
	columns: C[]
	isDeletedFunc?: (row: R) => boolean
	columnHeaderFunc: (column: C) => ReactNode
	cellFunc: (column: C, row: R, columnIndex: number) => ReactNode
	rowNumberFunc?: (index: number) => string
	defaultActionFunc?: (row: R) => void
	rowActionsFunc?: (row: R) => ReactNode
}

const Table: FunctionComponent<TableUtilityProps<unknown, unknown>> = (
	props
) => {
	const {
		columns,
		rows,
		rowNumberFunc,
		defaultActionFunc,
		rowActionsFunc,
		columnHeaderFunc,
		isDeletedFunc,
		cellFunc,
	} = props
	const classes = styles.useUtilityStyles(
		{
			root: {
				display: "grid",
				overflow: "auto",
			},
			table: {
				width: "100%",
				overflow: "hidden",
			},
			header: {},
			headerCell: {
				"&:last-child": {
					borderRight: 0,
				},
			},
			rowNumberCell: {
				width: "1%",
				whiteSpace: "nowrap",
			},
			rowNumber: {
				textAlign: "center",
			},
			cell: {
				"&:last-child": {
					borderRight: 0,
				},
			},
			row: {
				"&:last-child>td": {
					borderBottom: 0,
				},
			},
			rowDeleted: {},
		},
		props
	)

	return (
		<div className={classes.root}>
			<table
				className={styles.cx(
					classes.table,
					defaultActionFunc && "defaultaction"
				)}
			>
				<thead className={classes.header}>
					<tr>
						{rowNumberFunc && (
							<th
								className={styles.cx(
									classes.headerCell,
									classes.rowNumberCell
								)}
								key="rownumbers"
							/>
						)}
						{columns?.map((column, index) => (
							<th key={index} className={classes.headerCell}>
								{columnHeaderFunc(column)}
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
				<tbody>
					{rows.map((row, index) => (
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
							{rowNumberFunc && (
								<td
									className={styles.cx(
										classes.cell,
										classes.rowNumberCell
									)}
									key="rownumbers"
								>
									<div className={classes.rowNumber}>
										{rowNumberFunc(index + 1)}
									</div>
								</td>
							)}
							{columns.map((column, i) => (
								<td key={i} className={classes.cell}>
									{cellFunc(column, row, i)}
								</td>
							))}
							{rowActionsFunc && (
								<td key="rowactions" className={classes.cell}>
									{rowActionsFunc(row)}
								</td>
							)}
						</tr>
					))}
				</tbody>
			</table>
		</div>
	)
}

export { TableUtilityProps }

export default Table
