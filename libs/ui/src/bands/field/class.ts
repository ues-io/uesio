import { FieldMetadata } from "./types"
import { Context } from "../../context/context"
import { addBlankSelectOption } from "./utils"
import { getKey } from "../../metadata/metadata"
import { SelectOption } from "../../definition/selectlist"
import { Bundleable } from "../../metadataexports"

const referenceTypes = ["REFERENCE", "USER", "FILE"]

export type GetSelectOptionsProps = {
	context: Context
	// A blank option is added by default, but can be disabled by setting this to false
	addBlankOption?: boolean
}

class Field {
	constructor(source: FieldMetadata) {
		this.source = source
	}

	source: FieldMetadata

	/**
	 * getId - returns the fully-qualified id of the field, with namespace and name (if namespace is defined)
	 * @returns string
	 */
	getId = () => getKey(this.source)
	/**
	 * getName - returns the local name of the field
	 * @returns string
	 */
	getName = () => this.source.name
	/**
	 * getNamespace - returns the app namespace in which this field is defined
	 * @returns string
	 */
	getNamespace = () => this.source.namespace
	getLabel = () => this.source.label
	getReferenceMetadata = () => this.source.reference
	getType = () => this.source.type
	getCreateable = () => this.source.createable
	getUpdateable = () => this.source.updateable
	getAccessible = () => this.source.accessible
	getSelectMetadata = (context: Context) => {
		let selectMetadata = this.source.selectlist
		if (!selectMetadata) {
			return undefined
		}
		// If we have a name, but no options, we need to grab the full metadata from redux
		if (!selectMetadata.options && selectMetadata.name) {
			const key = getKey(selectMetadata as Bundleable)
			const reduxMetadata = context.getSelectList(key)
			if (reduxMetadata) {
				selectMetadata = reduxMetadata
			}
		}
		return selectMetadata
	}
	getSelectOptions = (props: GetSelectOptionsProps) => {
		const { context, addBlankOption = true } = props
		const selectMetadata = this.getSelectMetadata(context)
		if (!selectMetadata) {
			return []
		}
		const {
			blank_option_label: blankOptionLabel,
			blank_option_language_label: blankOptionLanguageLabel,
			options,
		} = selectMetadata

		const mergedOptions =
			options?.map(
				({ label, languageLabel, ...rest }) =>
					({
						...rest,
						label: languageLabel
							? context.getLabel(languageLabel) || label
							: label,
					} as SelectOption)
			) || []

		if (!addBlankOption) {
			return mergedOptions
		}
		const mergedBlankLabel =
			context.getLabel(blankOptionLanguageLabel || "") || blankOptionLabel
		return addBlankSelectOption(mergedOptions, mergedBlankLabel)
	}
	getAccept = () => {
		switch (this.source.file?.accept) {
			case "AUDIO":
				return "audio/*"
			case "DOCUMENT":
				return ".pdf,.yaml,.doc,.docx,.xml,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
			case "IMAGE":
				return "image/*"
			case "VIDEO":
				return "video/*"
			default:
				return ""
		}
	}
	getFileMetadata = () => this.source.file
	getMetadataFieldMetadata = () => this.source.metadata
	getNumberMetadata = () => this.source.number
	/**
	 * Returns true if this is one of the "Reference" field types:
	 *  - Reference
	 *  - User
	 *  - File
	 * @returns Boolean
	 */
	isReference = () => referenceTypes.includes(this.source.type)
	isRequired = () => this.source.required === true
	getSubFields = () => this.source.subfields
	hasSubFields = () => this.source.subfields !== undefined
	getSubType = () => this.source.subtype
}

export default Field
