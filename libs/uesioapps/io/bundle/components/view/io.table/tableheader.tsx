import { FunctionComponent } from "react"
import { collection, definition, styles } from "@uesio/ui"
import { ColumnDefinition, RowAction, TableClasses } from "./tabledefinition"

type Props = {
	columns: definition.DefinitionList
	collection: collection.Collection
	classes: TableClasses
	rowactions: RowAction[]
	rownumbers: boolean
}

const TableHeader: FunctionComponent<Props> = ({
	classes,
	rowactions,
	rownumbers,
	columns,
	collection,
}) => (
	<thead key={0} className={classes.header}>
		<tr>
			{rownumbers && (
				<th
					className={styles.cx(classes.cell, classes.rowNumberCell)}
					key="rownumbers"
				/>
			)}
			{columns?.map((columnDef) => {
				const column = columnDef["io.column"] as ColumnDefinition
				const fieldId = column.field
				const fieldMetadata = collection.getField(fieldId)
				return (
					<th className={classes.headerCell} key={fieldId}>
						{column.label || fieldMetadata?.getLabel()}
					</th>
				)
			})}
			{rowactions && (
				<th className={classes.headerCell} key="rowactions" />
			)}
		</tr>
	</thead>
)

export default TableHeader
