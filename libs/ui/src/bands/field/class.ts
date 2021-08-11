import { FieldMetadata } from "./types"

class Field {
	constructor(source: FieldMetadata) {
		this.source = source
	}

	source: FieldMetadata

	getId = () => this.source.namespace + "." + this.source.name
	getLabel = () => this.source.label
	getType = () => this.source.type
	getCreateable = () => this.source.createable
	getUpdateable = () => this.source.updateable
	getAccessible = () => this.source.accessible
	getOptions = () => this.source.options || null
	getAccept = () => this.source.accept
}

export default Field
