import { FunctionComponent, ReactNode } from "react"
import { definition, styles } from "@uesio/ui"

type ColumnDef = {
	label: string
}

type RowDef = {
	cells: ReactNode[]
	rowactions?: ReactNode
	isDeleted?: boolean
}

interface TableUtilityProps extends definition.UtilityProps {
	columns: ColumnDef[]
	rows: RowDef[]
	showRowNumbers?: boolean
	showRowActions?: boolean
	rowNumberStart?: number
}

const Table: FunctionComponent<TableUtilityProps> = (props) => {
	const {
		columns,
		rows,
		showRowNumbers,
		showRowActions,
		rowNumberStart = 0,
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
			<table className={classes.table}>
				<thead className={classes.header}>
					<tr>
						{showRowNumbers && (
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
						{showRowActions && (
							<th
								className={classes.headerCell}
								key="rowactions"
							/>
						)}
					</tr>
				</thead>
				<tbody>
					{rows.map(({ isDeleted, rowactions, cells }, index) => (
						<tr
							className={styles.cx(
								classes.row,
								isDeleted && classes.rowDeleted
							)}
							key={rowNumberStart + index + 1}
						>
							{showRowNumbers && (
								<td
									className={styles.cx(
										classes.cell,
										classes.rowNumberCell
									)}
									key="rownumbers"
								>
									<div className={classes.rowNumber}>
										{rowNumberStart + index + 1}
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
							{rowactions && (
								<td key="rowactions" className={classes.cell}>
									{rowactions}
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
