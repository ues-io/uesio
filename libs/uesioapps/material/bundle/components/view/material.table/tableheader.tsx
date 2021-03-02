import React, { FunctionComponent } from "react"
import * as material from "@material-ui/core"
import { collection, definition } from "@uesio/ui"
import { ColumnDefinition } from "./tabledefinition"

type Props = {
	columns: definition.DefinitionList
	collection: collection.Collection
}

const TableHeader: FunctionComponent<Props> = (props) => (
	<material.TableHead key={0}>
		<material.TableRow>
			{props.columns.map((columnDef) => {
				const column = columnDef["material.column"] as ColumnDefinition
				const fieldId = column.field
				const fieldMetadata = props.collection.getField(fieldId)
				return (
					<material.TableCell key={fieldId}>
						{column.label || fieldMetadata?.getLabel()}
					</material.TableCell>
				)
			})}
		</material.TableRow>
	</material.TableHead>
)

export default TableHeader
