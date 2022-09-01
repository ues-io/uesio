import cli from "cli-ux"
import chalk from "chalk"
import type { collection, wire } from "@uesio/ui"

type TableColumn = {
	id: string
	type?: string
}

const wiretable = (
	response: wire.PlainWire,
	metadata: Record<string, collection.PlainCollection>,
	columns: TableColumn[]
): void => {
	const collectionMetadata = metadata[response.collection]
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const tableColumns = {} as any

	columns.forEach((column) => {
		const fieldMetadata = collectionMetadata.fields[column.id]
		const tableColumn = {
			header: fieldMetadata.label,
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
		} as any
		if (column.type === "COLOR") {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			tableColumn.get = (row: any): string => {
				const value = row[column.id]
				return chalk.hex(value).bold(value)
			}
		}
		tableColumns[column.id] = tableColumn
	})
	if (response.data) {
		cli.table(Object.values(response.data), tableColumns)
	}
}

export { wiretable, TableColumn }
