import { FieldMetadata, SelectOption } from "./types"
import { Context } from "../../context/context"
import { addBlankSelectOption } from "./utils"
import { getKey } from "../../metadata/metadata"

class Field {
	constructor(source: FieldMetadata) {
		this.source = source
	}

	source: FieldMetadata

	getId = () => getKey(this.source)
	getName = () => this.source.name
	getNamespace = () => this.source.namespace
	getLabel = () => this.source.label
	getReferenceMetadata = () => this.source.reference
	getType = () => this.source.type
	getCreateable = () => this.source.createable
	getUpdateable = () => this.source.updateable
	getAccessible = () => this.source.accessible
	getSelectMetadata = () => this.source.selectlist
	getSelectOptions = (context: Context) => {
		const selectMetadata = this.getSelectMetadata()
		if (!selectMetadata) return []
		if (selectMetadata.blank_option_label === undefined)
			return selectMetadata.options || []

		const mergedOptions = selectMetadata.options.map(
			({ label, languageLabel, value, disabled, title }) =>
				({
					label: languageLabel
						? context.getLabel(languageLabel) || label
						: label,
					value,
					disabled,
					title,
				} as SelectOption)
		)

		const mergedBlankLabel =
			context.getLabel(
				selectMetadata.blank_option_language_label || ""
			) || selectMetadata.blank_option_label
		return this.source?.type === "MULTISELECT"
			? mergedOptions
			: addBlankSelectOption(mergedOptions, mergedBlankLabel)
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
	isReference = () =>
		this.source.type === "REFERENCE" ||
		this.source.type === "USER" ||
		this.source.type === "FILE"
	isRequired = () => this.source.required === true
	getSubFields = () => this.source.subfields
	getSubType = () => this.source.subtype
}

export default Field
