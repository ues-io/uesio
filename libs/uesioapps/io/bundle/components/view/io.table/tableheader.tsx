import { FunctionComponent } from "react"
import { collection, definition } from "@uesio/ui"
import { ColumnDefinition } from "./tabledefinition"

type Props = {
	columns: definition.DefinitionList
	collection: collection.Collection
}

const TableHeader: FunctionComponent<Props> = (props) => (
	<thead key={0}>
		<tr>
			{props.columns.map((columnDef) => {
				const column = columnDef["io.column"] as ColumnDefinition
				const fieldId = column.field
				const fieldMetadata = props.collection.getField(fieldId)
				return (
					<th key={fieldId}>
						{column.label || fieldMetadata?.getLabel()}
					</th>
				)
			})}
		</tr>
	</thead>
)

export default TableHeader
