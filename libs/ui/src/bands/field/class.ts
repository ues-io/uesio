import { FieldMetadata } from "./types"
import { addBlankSelectOption } from "./utils"

class Field {
	constructor(source: FieldMetadata) {
		this.source = source
	}

	source: FieldMetadata

	getId = () => this.source.namespace + "." + this.source.name
	getLabel = () => this.source.label
	getReferenceMetadata = () => this.source.reference
	getType = () => this.source.type
	getCreateable = () => this.source.createable
	getUpdateable = () => this.source.updateable
	getAccessible = () => this.source.accessible
	getSelectMetadata = () => this.source.selectlist
	getSelectOptions = () => {
		const selectMetadata = this.getSelectMetadata()
		if (!selectMetadata) return []
		if (selectMetadata.blank_option_label === undefined)
			return selectMetadata.options || []
		return addBlankSelectOption(
			selectMetadata.options,
			selectMetadata.blank_option_label
		)
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
	getNumberMetadata = () => this.source.number
	isReference = () =>
		this.source.type === "REFERENCE" ||
		this.source.type === "USER" ||
		this.source.type === "FILE"
	getSubFields = () => this.source.subfields
}

export default Field
