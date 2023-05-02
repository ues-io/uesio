import { FunctionComponent } from "react"
import { definition, collection, metadata, wire } from "@uesio/ui"
import SearchBox from "../../components/searchbox/searchbox"
interface SearchBoxFilterProps extends definition.UtilityProps {
	path: string
	wire: wire.Wire
    fieldMetadata: collection.Field
}

const SearchBoxFilter: FunctionComponent<SearchBoxFilterProps> = (props) => {
	const { wire, context, fieldMetadata, path } = props
	const wireId = wire.getId()
    const fieldId = fieldMetadata.getId() as metadata.MetadataKey
    const placeholder = fieldMetadata.getLabel()
	return (
		<SearchBox
            path={path}
			context={context}
			definition={{ wire: wireId, searchFields: [fieldId as metadata.MetadataKey], placeholder: `Search ${placeholder}`}}
		/>
	)
}

export default SearchBoxFilter
