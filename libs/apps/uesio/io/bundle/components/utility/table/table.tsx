import { FunctionComponent, ReactNode } from "react"
import { definition, styles, context } from "@uesio/ui"

type ColumnDef = {
	label: string
}

type RowDef = {
	cells: ReactNode[]
	isDeleted?: boolean
	context: context.Context
}

interface TableUtilityProps extends definition.UtilityProps {
	columns: ColumnDef[]
	rows: RowDef[]
	rowNumberFunc?: (index: number) => string
	defaultActionFunc?: (context: context.Context) => void
	rowActionsFunc?: (context: context.Context) => ReactNode
}

const Table: FunctionComponent<TableUtilityProps> = (props) => {
	const { columns, rows, rowNumberFunc, defaultActionFunc, rowActionsFunc } =
		props
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
						{columns?.map((columnDef, index) => (
							<th
								key={columnDef.label + index}
								className={classes.headerCell}
							>
								{columnDef.label}
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
					{rows.map(({ isDeleted, cells, context }, index) => (
						<tr
							onClick={
								defaultActionFunc
									? () => defaultActionFunc(context)
									: undefined
							}
							className={styles.cx(
								classes.row,
								isDeleted && classes.rowDeleted
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
							{cells?.map((columnNode, i) => (
								<td
									key={`${cells.length + i}`}
									className={classes.cell}
								>
									{columnNode}
								</td>
							))}
							{rowActionsFunc && (
								<td key="rowactions" className={classes.cell}>
									{rowActionsFunc(context)}
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
