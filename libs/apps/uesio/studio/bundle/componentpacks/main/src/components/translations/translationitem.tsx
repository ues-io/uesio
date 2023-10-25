import { definition, component, styles } from "@uesio/ui"

interface Props {
	namespace: string
	translations: TranslationRecord[]
	setTranslations: (newTranslations: TranslationRecord[]) => void
}

const StyleDefaults = Object.freeze({
	root: ["mt-10"],
})

const subFields = {
	key: {
		name: "key",
		label: "Name",
		updateable: false,
	},
	displayLabel: {
		name: "displayLabel",
		label: "Value",
		updateable: false,
	},
	translation: {
		name: "translation",
		label: "Translation",
	},
}

export type TranslationRecord = {
	key: string
	displayLabel: string
	translation: string
}

/**
 * Displays an editable list of translations for a particular namespace
 * @param props
 * @returns
 */
const TranslationItem: definition.UtilityComponent<Props> = (props) => {
	const ListField = component.getUtility("uesio/io.listfield")
	const TitleBar = component.getUtility("uesio/io.titlebar")
	const {
		context,
		// The namespace to display translations for, e.g. "uesio/io"
		namespace,
		// Translations for this namespace
		translations,
		// Setter to be invoked when translations for this namespace are updated
		setTranslations,
	} = props
	const classes = styles.useUtilityStyleTokens(StyleDefaults, props)
	return (
		<div className={classes.root}>
			<TitleBar title={namespace} context={context} />
			<ListField
				options={{
					noAdd: true,
					noDelete: true,
					subType: "STRUCT",
					subFields,
				}}
				value={translations}
				setValue={setTranslations}
				mode={"EDIT"}
				context={context}
			/>
		</div>
	)
}

export default TranslationItem
