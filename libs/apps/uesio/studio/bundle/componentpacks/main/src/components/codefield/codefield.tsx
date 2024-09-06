import { definition, component, context } from "@uesio/ui"

type CodeFieldDefinition = {
	fieldId: string
	language?: CodeFieldLanguage
	id?: string
	mode?: context.FieldMode
}

type CodeFieldLanguage = "yaml" | "json" | "javascript" | "typescript"

const CodeField: definition.UC<CodeFieldDefinition> = (props) => {
	const IOCodeField = component.getUtility("uesio/io.codefield")
	const FieldWrapper = component.getUtility("uesio/io.fieldwrapper")
	const { context, definition } = props
	const record = context.getRecord()
	const wire = context.getWire()
	if (!wire || !record) {
		return null
	}

	const collection = wire.getCollection()
	const fieldId = definition.fieldId

	const fieldMetadata = collection.getField(fieldId)
	if (!fieldMetadata) return null
	const value = record.getFieldValue(fieldId)

	const language = definition.language || "yaml"
	const mode = definition.mode || "EDIT"

	const changeHandler = (newValue: string) => {
		const oldValue = context.getRecord()?.getFieldValue(fieldId) || ""
		if (newValue !== oldValue) record.update(fieldId, newValue, context)
	}

	return (
		<FieldWrapper context={context}>
			<IOCodeField
				label={fieldMetadata.getLabel()}
				value={value || ""}
				setValue={changeHandler}
				language={language}
				mode={mode}
				context={props.context}
			/>
		</FieldWrapper>
	)
}

export default CodeField
