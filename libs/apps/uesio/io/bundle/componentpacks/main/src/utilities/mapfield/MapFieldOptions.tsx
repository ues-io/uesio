import { definition } from "@uesio/ui"

export type MapFieldOptions = {
	components?: definition.DefinitionList
	/**
	 * The label to display for the Field for editing a map entry's key
	 * @default "Key"
	 */
	keyFieldLabel?: string
	/**
	 * The label to display for the Field for editing a map entry's value
	 * @default "Value"
	 */
	valueFieldLabel?: string
}
