import { FunctionComponent } from "react"
import { definition, wire } from "@uesio/ui"

import TranslationItem, { TranslationRecord } from "./translationitem"

type TranslationDefinition = {
	labelsWire: string
	translationsWire: string
	// The field on the translationsWire that contains the labels for the translation
	labelsFieldId: string
}

interface Props extends definition.BaseProps {
	definition: TranslationDefinition
}

const buildTranslationRecordsByNamespace = (
	labels: wire.WireRecord[],
	existingTranslations: wire.PlainWireRecord
): Record<string, TranslationRecord[]> =>
	labels.reduce(
		(acc: Record<string, TranslationRecord[]>, label: wire.WireRecord) => {
			const namespace = label.getFieldValue<string>(
				"uesio/studio.namespace"
			) as string
			let labelsForNS = acc[namespace]
			if (!labelsForNS) {
				labelsForNS = acc[namespace] = []
			}
			// Build up a translation record
			const key = label.getUniqueKey() as string
			const translationRecord = {
				key,
				displayLabel: label.getFieldValue("uesio/studio.value"),
				translation: existingTranslations[key],
			} as TranslationRecord
			// Add it to the list of translations for this namespace
			labelsForNS.push(translationRecord)
			return acc
		},
		{}
	)

const Translation: FunctionComponent<Props> = (props) => {
	const { context, definition } = props

	const {
		labelsFieldId,
		labelsWire: labelsWireId,
		translationsWire: translationsWireId,
	} = definition
	const translationsWire = context.getWire(translationsWireId)
	const translationRecord = context.getRecord(translationsWireId)
	const labelsWire = context.getWire(labelsWireId)

	if (
		!translationsWire ||
		!labelsWire ||
		!translationRecord ||
		!labelsFieldId
	) {
		return null
	}

	const existingTranslations =
		translationRecord.getFieldValue<wire.PlainWireRecord>(labelsFieldId) ||
		{}
	const allLabels = (labelsWire?.getData() || []) as wire.WireRecord[]
	const translationRecordsByNamespace = buildTranslationRecordsByNamespace(
		allLabels,
		existingTranslations
	)

	return (
		<>
			{Object.entries(translationRecordsByNamespace).map(
				([namespace, translationsForNamespace]) => (
					<TranslationItem
						key={namespace}
						namespace={namespace}
						context={context}
						translations={translationsForNamespace}
						setTranslations={(
							newTranslations: TranslationRecord[]
						): void => {
							const newTranslationValues = {
								...existingTranslations,
							}
							newTranslations.forEach(({ key, translation }) => {
								newTranslationValues[key] = translation
							})
							translationRecord.update(
								labelsFieldId,
								newTranslationValues,
								context
							)
						}}
					/>
				)
			)}
		</>
	)
}

export default Translation
