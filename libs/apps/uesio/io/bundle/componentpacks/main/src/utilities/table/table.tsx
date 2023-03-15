import { FunctionComponent, ReactNode } from "react"
import { definition, styles } from "@uesio/ui"
import { cx } from "@emotion/css"
import CheckboxField from "../field/checkbox"

interface TableColumn {
	width?: string
}

interface TableUtilityProps<R, C extends TableColumn>
	extends definition.UtilityProps {
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

const Table: FunctionComponent<TableUtilityProps<unknown, TableColumn>> = (
	props
) => {
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
			headerCellInner: {},
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
				"& .unselected > .rownum": {
					display: "block",
				},
				"& .unselected > .selectbox": {
					display: "none",
				},
				"& .selected > .rownum": {
					display: "none",
				},
				"& .selected > .selectbox": {
					display: "block",
				},
				"&:hover .rownum": {
					display: "none",
				},
				"&:hover .selectbox": {
					display: "block",
				},
			},
			rowDeleted: {},
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

	const getRowNumberCell = (row: unknown, index: number) => {
		if (isSelectedFunc && onSelectChange) {
			const isSelected = isSelectedFunc(row, index)
			return (
				<div className={cx(isSelected ? "selected" : "unselected")}>
					<div className="rownum">{rowNumberFunc?.(index + 1)}</div>
					<div className="selectbox">
						<CheckboxField
							context={context}
							value={isSelected}
							setValue={(value: boolean) =>
								onSelectChange(row, index, value)
							}
							mode="EDIT"
						/>
					</div>
				</div>
			)
		}
		return rowNumberFunc?.(index + 1)
	}

	return (
		<div className={classes.root}>
			<table
				id={id}
				className={styles.cx(
					classes.table,
					defaultActionFunc && "defaultaction"
				)}
			>
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
							{(rowNumberFunc || isSelectedFunc) && (
								<td
									className={styles.cx(
										classes.cell,
										classes.rowNumberCell
									)}
									key="rownumbers"
								>
									<div className={classes.rowNumber}>
										{getRowNumberCell(row, index)}
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
