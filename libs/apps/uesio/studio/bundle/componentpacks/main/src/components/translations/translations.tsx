import { FunctionComponent } from "react"
import { definition, api, wire } from "@uesio/ui"

import TranslationItem from "./translationitem"

type TranslationDefinition = {
	fieldId: string
}

interface Props extends definition.BaseProps {
	definition: TranslationDefinition
}

const Translation: FunctionComponent<Props> = (props) => {
	const { context, definition } = props

	const { fieldId } = definition
	const wire = context.getWire()
	const record = context.getRecord()

	if (!wire || !fieldId || !record) {
		return null
	}

	const originalValue =
		record.getFieldValue<wire.PlainWireRecord>(fieldId) || {}
	const [namespaces] = api.builder.useAvailableNamespaces(context, "LABEL")

	if (!namespaces) return null

	return (
		<>
			{namespaces.map((entry) => (
				<TranslationItem
					key={entry}
					value={originalValue}
					namespace={entry}
					context={context}
					setValue={(value: wire.PlainWireRecord): void => {
						record.update(fieldId, value)
					}}
				/>
			))}
		</>
	)
}

export default Translation
