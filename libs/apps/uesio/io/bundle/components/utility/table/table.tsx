import { FunctionComponent, ReactNode } from "react"
import { definition, styles } from "@uesio/ui"

interface TableUtilityProps<R, C> extends definition.UtilityProps {
	rows: R[]
	columns: C[]
	isDeletedFunc?: (row: R) => boolean
	columnHeaderFunc: (column: C) => ReactNode
	cellFunc: (column: C, row: R, columnIndex: number) => ReactNode
	rowNumberFunc: (index: number) => string | null
	rowSelectFunc: () => {
		toggleAll: () => void
		toggleAllCheckbox: ReactNode
		rowHelpers: (recordContext: R) => {
			handleClick: () => void
			isSelected: boolean
			checkbox: ReactNode
		}
	} | null
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
		rowSelectFunc,
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
			rowPrefixCell: {
				width: "1%",
				whiteSpace: "nowrap",
				textAlign: "center",
				"&.isSelected, &:hover.allowSelection": {
					".rowNumber": {
						display: "none",
					},
					".rowCheckbox": {
						display: "initial",
					},
				},
				".rowCheckbox": {
					display: "none",
					pointerEvents: "none",
				},
				"&.hidden": {
					"& div": {
						opacity: 0,
					},
					"&:hover div": {
						opacity: 1,
					},
				},
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

	const rowSelectHelpers = rowSelectFunc()

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
						{(rowNumberFunc(1) || rowSelectHelpers) && (
							<th
								className={styles.cx(
									classes.headerCell,
									classes.rowPrefixCell,
									rowSelectHelpers ? "hidden" : ""
								)}
								onClick={() => rowSelectHelpers?.toggleAll()}
								key="rownumbers"
							>
								{rowSelectHelpers && (
									<div className="toggleAllCheckBox">
										{rowSelectHelpers.toggleAllCheckbox}
									</div>
								)}
							</th>
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
					{rows.map((row, index) => {
						const rowNumber = rowNumberFunc(index)
						const rowHelpers = rowSelectHelpers?.rowHelpers(row)
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
								{(rowNumber || rowHelpers) && (
									<td
										className={styles.cx(
											classes.cell,
											classes.rowPrefixCell,
											rowHelpers ? "allowSelection" : "",
											rowHelpers?.isSelected
												? "isSelected"
												: ""
										)}
										key="rownumbers"
										onClick={rowHelpers?.handleClick}
									>
										{rowNumber && (
											<div className="rowNumber">
												{rowNumber}
											</div>
										)}
										{rowHelpers && (
											<div className="rowCheckbox">
												{rowHelpers.checkbox}
											</div>
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
		</div>
	)
}

export { TableUtilityProps }

export default Table
