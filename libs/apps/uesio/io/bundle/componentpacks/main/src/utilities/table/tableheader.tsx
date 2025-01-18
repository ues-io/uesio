import { definition, styles, context } from "@uesio/ui"
import { ReactNode } from "react"
import CheckboxField from "../field/checkbox"

interface TableColumn {
  width?: string
}

type IsAllSelectedFunc = () => boolean | undefined
type OnAllSelectChange = (selected: boolean) => void
type ColumnFunc<C extends TableColumn> = (column: C) => ReactNode
type RowNumberFunc = (index: number) => string
type RowFunc<R> = (row: R) => ReactNode
type RowIsFunc<R> = (row: R, index: number) => boolean
type ColumnClasses = Record<
  "header" | "headerCell" | "headerCellInner" | "rowNumberCell",
  string
>

interface TableHeaderUtilityProps<R, C extends TableColumn> {
  classes: ColumnClasses
  columns: C[]
  rowNumberFunc?: RowNumberFunc
  isSelectedFunc?: RowIsFunc<R>
  isAllSelectedFunc?: IsAllSelectedFunc
  onAllSelectChange?: OnAllSelectChange
  columnHeaderFunc: ColumnFunc<C>
  columnMenuFunc?: ColumnFunc<C>
  rowActionsFunc?: RowFunc<R>
}

const getRowNumberHeaderCell = (
  context: context.Context,
  isAllSelectedFunc?: IsAllSelectedFunc,
  onAllSelectChange?: OnAllSelectChange,
) => {
  if (!isAllSelectedFunc || !onAllSelectChange) return undefined

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

const getHeaderCell = <C extends TableColumn>(
  classes: ColumnClasses,
  column: C,
  index: number,
  columnHeaderFunc: ColumnFunc<C>,
  columnMenuFunc?: ColumnFunc<C>,
) => (
  <th
    key={index}
    className={classes.headerCell}
    style={{
      ...(column.width && { minWidth: column.width }),
    }}
  >
    <div className={classes.headerCellInner}>
      {columnHeaderFunc(column)}
      {columnMenuFunc && columnMenuFunc(column)}
    </div>
  </th>
)

const TableHeader: definition.UtilityComponent<
  TableHeaderUtilityProps<unknown, TableColumn>
> = (props) => {
  const {
    columns,
    rowNumberFunc,
    isSelectedFunc,
    isAllSelectedFunc,
    onAllSelectChange,
    rowActionsFunc,
    columnHeaderFunc,
    columnMenuFunc,
    classes,
    context,
  } = props

  return (
    <thead className={classes.header}>
      <tr>
        {(rowNumberFunc || isSelectedFunc) && (
          <th
            className={styles.cx(classes.headerCell, classes.rowNumberCell)}
            key="rownumbers"
          >
            {getRowNumberHeaderCell(
              context,
              isAllSelectedFunc,
              onAllSelectChange,
            )}
          </th>
        )}
        {columns?.map((column, index) =>
          getHeaderCell(
            classes,
            column,
            index,
            columnHeaderFunc,
            columnMenuFunc,
          ),
        )}
        {rowActionsFunc && (
          <th className={classes.headerCell} key="rowactions" />
        )}
      </tr>
    </thead>
  )
}

export default TableHeader

export type {
  TableColumn,
  IsAllSelectedFunc,
  OnAllSelectChange,
  ColumnFunc,
  RowNumberFunc,
  RowFunc,
  RowIsFunc,
}
