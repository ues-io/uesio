import React, { ReactElement, useState } from "react"
import { definition, material } from "@uesio/ui"
import LazyMonaco from "@uesio/lazymonaco"

type CodeFieldDefinition = {
	fieldId: string
	height: string
	language?: "yaml" | "json" | "javascript"
	id?: string
}

const tryParseJSON = (jsonString: string) => {
	try {
		const o = JSON.parse(jsonString)

		// Handle non-exception-throwing cases:
		// Neither JSON.parse(false) or JSON.parse(1234) throw errors, hence the type-checking,
		// but... JSON.parse(null) returns null, and typeof null === "object",
		// so we must check for that, too. Thankfully, null is falsey, so this suffices:
		if (o && typeof o === "object") {
			return o
		}
	} catch (e) {}

	return false
}

interface Props extends definition.BaseProps {
	definition: CodeFieldDefinition
}

const useStyles = material.makeStyles((theme) =>
	material.createStyles({
		root: () => ({
			margin: theme.spacing(1),
		}),
		input: (props: Props) => ({
			height: props.definition.height || "200px",
			margin: theme.spacing(1, 0),
			border: "1px solid #c8c8c8",
		}),
	})
)

function CodeField(props: Props): ReactElement | null {
	const classes = useStyles(props)
	const record = props.context.getRecord()
	const wire = props.context.getWire()
	if (!wire || !record) {
		return null
	}

	const collection = wire.getCollection()
	const fieldId = props.definition.fieldId
	const [editorContent, setEditorContent] = useState<string>(
		JSON.stringify(record.getFieldValue(fieldId), null, "\t")
	)

	const fieldMetadata = collection.getField(fieldId)

	if (!fieldMetadata.isValid()) {
		return null
	}
	const language = props.definition.language as string

	return (
		<div className={classes.root}>
			<material.InputLabel shrink={true}>
				{fieldMetadata.getLabel()}
			</material.InputLabel>
			<div className={classes.input}>
				<LazyMonaco
					{...{
						value:
							language === "json"
								? (editorContent as string)
								: (record.getFieldValue(fieldId) as string),
						language: language,
						onChange: (newValue /*, event*/): void => {
							if (language === "json") {
								if (tryParseJSON(newValue)) {
									setEditorContent(newValue)
									record.update(
										fieldId,
										tryParseJSON(newValue)
									)
								}
							} else {
								record.update(fieldId, newValue)
							}
						},
					}}
				></LazyMonaco>
			</div>
		</div>
	)
}

export default CodeField
