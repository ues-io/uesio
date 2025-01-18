import { ReactNode } from "react"
import { definition, styles } from "@uesio/ui"
import TableHeader, {
  ColumnFunc,
  IsAllSelectedFunc,
  OnAllSelectChange,
  RowFunc,
  RowIsFunc,
  RowNumberFunc,
  TableColumn,
} from "./tableheader"
import TableRow, { RowChangeFunc } from "./tablerow"

interface TableUtilityProps<R, C extends TableColumn> {
  rows: R[]
  columns: C[]
  isDeletedFunc?: RowIsFunc<R>
  isSelectedFunc?: RowIsFunc<R>
  isRowExpandedFunc?: RowIsFunc<R>
  isAllSelectedFunc?: IsAllSelectedFunc
  onSelectChange?: RowChangeFunc<R>
  onAllSelectChange?: OnAllSelectChange
  columnHeaderFunc: ColumnFunc<C>
  columnMenuFunc?: ColumnFunc<C>
  cellFunc: (column: C, row: R, columnIndex: number) => ReactNode
  rowNumberFunc?: RowNumberFunc
  defaultActionFunc?: RowChangeFunc<R>
  rowActionsFunc?: RowFunc<R>
  drawerRendererFunc?: RowFunc<R>
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
    "uesio/io.table",
  )

  return (
    <div className={classes.root}>
      <table id={id} className={classes.table}>
        <TableHeader
          classes={classes}
          columns={columns}
          context={context}
          rowNumberFunc={rowNumberFunc}
          isSelectedFunc={isSelectedFunc}
          isAllSelectedFunc={isAllSelectedFunc}
          onAllSelectChange={onAllSelectChange}
          rowActionsFunc={rowActionsFunc}
          columnHeaderFunc={columnHeaderFunc}
          columnMenuFunc={columnMenuFunc}
        />
        <tbody
          className={styles.cx(
            classes.body,
            defaultActionFunc && "hasRowAction",
          )}
        >
          {rows.map((row, index) => (
            <TableRow
              key={rowKeyFunc(row)}
              classes={classes}
              columns={columns}
              row={row}
              index={index}
              context={context}
              rowNumberFunc={rowNumberFunc}
              rowActionsFunc={rowActionsFunc}
              defaultActionFunc={defaultActionFunc}
              isSelectedFunc={isSelectedFunc}
              onSelectChange={onSelectChange}
              drawerRendererFunc={drawerRendererFunc}
              isRowExpandedFunc={isRowExpandedFunc}
              isDeletedFunc={isDeletedFunc}
              cellFunc={cellFunc}
            />
          ))}
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
