import { FunctionComponent } from "react"
import { definition, collection, metadata, wire } from "@uesio/ui"
import SearchBox from "../../components/searchbox/searchbox"
interface SearchBoxFilterProps extends definition.UtilityProps {
	path: string
	wire: wire.Wire
	fieldMetadata: collection.Field
	placeholder?: string
}

const TextFilter: FunctionComponent<SearchBoxFilterProps> = (props) => {
	const { wire, context, fieldMetadata, path, placeholder } = props
	const wireId = wire.getId()
	const fieldId = fieldMetadata.getId() as metadata.MetadataKey

	return (
		<SearchBox
			path={path}
			context={context}
			definition={{
				wire: wireId,
				searchFields: [fieldId],
				placeholder:
					placeholder || `Search ${fieldMetadata.getLabel()}`,
			}}
		/>
	)
}

export default TextFilter
