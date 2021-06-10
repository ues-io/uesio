import { FunctionComponent } from "react"
import { collection, definition } from "@uesio/ui"
import { ColumnDefinition, RowAction, TableClasses } from "./tabledefinition"

type Props = {
	columns: definition.DefinitionList
	collection: collection.Collection
	classes: TableClasses
	rowactions: RowAction[]
}

const TableHeader: FunctionComponent<Props> = (props) => (
	<thead key={0} className={props.classes.header}>
		<tr>
			{props.columns.map((columnDef) => {
				const column = columnDef["io.column"] as ColumnDefinition
				const fieldId = column.field
				const fieldMetadata = props.collection.getField(fieldId)
				return (
					<th className={props.classes.headerCell} key={fieldId}>
						{column.label || fieldMetadata?.getLabel()}
					</th>
				)
			})}
			{props.rowactions && (
				<th className={props.classes.headerCell} key="rowactions" />
			)}
		</tr>
	</thead>
)

export default TableHeader
