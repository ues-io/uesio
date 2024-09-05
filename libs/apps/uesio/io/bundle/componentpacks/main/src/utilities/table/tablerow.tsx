import { context, definition, styles } from "@uesio/ui"
import { Fragment, ReactNode } from "react"
import CheckboxField from "../field/checkbox"
import { RowFunc, RowIsFunc, RowNumberFunc, TableColumn } from "./tableheader"

type RowClasses = Record<
	"row" | "rowExpanded" | "rowDeleted" | "cell" | "rowNumberCell" | "drawer",
	string
>

type RowChangeFunc<R> = (row: R, index: number, selected: boolean) => void

interface TableRowUtilityProps<R, C extends TableColumn> {
	classes: RowClasses
	columns: C[]
	row: R
	index: number
	rowNumberFunc?: RowNumberFunc
	isSelectedFunc?: RowIsFunc<R>
	rowActionsFunc?: RowFunc<R>
	onSelectChange?: RowChangeFunc<R>
	isRowExpandedFunc?: RowIsFunc<R>
	drawerRendererFunc?: RowFunc<R>
	defaultActionFunc?: RowChangeFunc<R>
	isDeletedFunc?: RowIsFunc<R>
	cellFunc: (column: C, row: R, columnIndex: number) => ReactNode
}

const getRowNumberCell = <R,>(
	row: R,
	index: number,
	isSelected: boolean,
	context: context.Context,
	onSelectChange?: RowChangeFunc<R>,
	rowNumberFunc?: RowNumberFunc
) => {
	if (!onSelectChange) {
		return rowNumberFunc?.(index + 1)
	}
	return (
		<>
			<div className="numberlabel">{rowNumberFunc?.(index + 1)}</div>
			<CheckboxField
				className={rowNumberFunc ? "numbercheck" : ""}
				context={context}
				value={isSelected}
				setValue={(value: boolean) => onSelectChange(row, index, value)}
				mode="EDIT"
			/>
		</>
	)
}

const getDrawer = <R,>(
	row: R,
	classes: RowClasses,
	drawerRendererFunc: RowFunc<R>
) => (
	<tr className={classes.row}>
		<td colSpan={1000} className={classes.drawer}>
			{drawerRendererFunc(row)}
		</td>
	</tr>
)

const TableRow: definition.UtilityComponent<
	TableRowUtilityProps<unknown, TableColumn>
> = (props) => {
	const {
		rowNumberFunc,
		isSelectedFunc,
		rowActionsFunc,
		classes,
		columns,
		row,
		index,
		context,
		onSelectChange,
		isRowExpandedFunc,
		drawerRendererFunc,
		defaultActionFunc,
		isDeletedFunc,
		cellFunc,
	} = props

	const isSelected = isSelectedFunc?.(row, index) || false
	const isExpanded = isRowExpandedFunc?.(row, index) || false
	const isDeleted = isDeletedFunc?.(row, index) || false

	return (
		<Fragment>
			<tr
				onClick={
					defaultActionFunc
						? () => defaultActionFunc(row, index, isSelected)
						: undefined
				}
				className={styles.cx(
					classes.row,
					isExpanded && classes.rowExpanded,
					isDeleted && classes.rowDeleted
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
						onClick={(e) => {
							// Stopping propagation here to prevent actions higher in the
							// hierarchy from firing. For example a default row action
							// for a table row.
							e.stopPropagation()
							onSelectChange?.(row, index, !isSelected)
						}}
					>
						{getRowNumberCell(
							row,
							index,
							isSelected,
							context,
							onSelectChange,
							rowNumberFunc
						)}
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
			{drawerRendererFunc &&
				isExpanded &&
				getDrawer(row, classes, drawerRendererFunc)}
		</Fragment>
	)
}

export default TableRow

export type { RowChangeFunc }
