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
	} catch (e) {
		console.log("Not an Object")
	}

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

	const fieldMetadata = collection.getField(fieldId)
	const fieldType = fieldMetadata.getType()
	const value = record.getFieldValue(fieldId)
	// TODO: Add special handline for fields of type "FILE"
	const stringValue = fieldType == "MAP" ? JSON.stringify(value, null, "\t") : value as string

	if (!fieldMetadata.isValid()) {
		return null
	}
	const language = props.definition.language || "yaml"

	return (
		<div className={classes.root}>
			<material.InputLabel shrink={true}>
				{fieldMetadata.getLabel()}
			</material.InputLabel>
			<div className={classes.input}>
				<LazyMonaco
					{...{
						value: stringValue,
						language: language,
						onChange: (newValue /*, event*/): void => {
							// TODO: Add special handline for fields of type "FILE"
							if (fieldType == "MAP") {
								if (language === "json") {
									const jsonValue = tryParseJSON(newValue)
									if (jsonValue) {
										record.update(
											fieldId,
											jsonValue
										)
									}
								}
							}
							else {
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
