import { FunctionComponent, ReactNode } from "react"
import { definition, styles, component } from "@uesio/ui"

interface TableUtilityProps<R, C> extends definition.UtilityProps {
	rows: R[]
	columns: C[]
	isDeletedFunc?: (row: R) => boolean
	columnHeaderFunc: (column: C) => ReactNode
	cellFunc: (column: C, row: R, columnIndex: number) => ReactNode
	rowNumberFunc: (index: number) => string | null
	rowSelectFunc: () => {
		selected: string[]
		toggleAll: () => void
		allAreSelected: boolean
		getRowItem: (recordContext: R) => {
			handleClick: () => void
			isSelected: boolean
		}
	} | null
	defaultActionFunc?: (row: R) => void
	rowActionsFunc?: (row: R) => ReactNode
}
const CheckboxField = component.getUtility("uesio/io.checkboxfield")

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
					"&.hasSelection div, &:hover div": {
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
									rowSelectHelpers ? "hidden" : "",
									rowSelectHelpers?.selected.length
										? "hasSelection"
										: ""
								)}
								onClick={rowSelectHelpers?.toggleAll}
								key="rownumbers"
							>
								{rowSelectHelpers && (
									<div className="toggleAllCheckBox">
										<CheckboxField
											context={props.context}
											value={
												rowSelectHelpers.allAreSelected
											}
											variant="uesio/io.field:uesio/io.table"
											setValue={
												rowSelectHelpers?.toggleAll
											}
										/>
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
						const rowItem = rowSelectHelpers?.getRowItem(row)
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
								{(rowNumber || rowItem) && (
									<td
										className={styles.cx(
											classes.cell,
											classes.rowPrefixCell,
											rowItem ? "allowSelection" : "",
											rowItem?.isSelected
												? "isSelected"
												: ""
										)}
										key={
											index +
											1 * (rowItem?.isSelected ? -1 : 1)
										}
										onClick={rowItem?.handleClick}
									>
										{rowNumber && (
											<div className="rowNumber">
												{rowNumber}
											</div>
										)}
										{rowItem && (
											<div className="rowCheckbox">
												<CheckboxField
													context={props.context}
													value={rowItem.isSelected}
													variant="uesio/io.field:uesio/io.table"
													setValue={
														rowItem.handleClick
													}
												/>
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
