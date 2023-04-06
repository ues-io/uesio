import { api, metadata, definition } from "@uesio/ui"
import debounce from "lodash/debounce"
import TextField from "../../utilities/field/text"
import FieldWrapper from "../../utilities/fieldwrapper/fieldwrapper"

type SearchBoxDefinition = {
	placeholder?: string
	wire: string
	searchFields: metadata.MetadataKey[]
}

const SearchBox: definition.UC<SearchBoxDefinition> = (props) => {
	const { definition, context } = props
	const wire = api.wire.useWire(definition.wire, context)
	if (!wire) return null
	const search = (searchValue: string) => {
		api.signal.run(
			{
				signal: "wire/SEARCH",
				search: searchValue,
				wire: wire.getId(),
				searchFields: definition.searchFields,
			},
			context
		)
	}
	const debouncedRequest = debounce(search, 250)
	return (
		<FieldWrapper labelPosition="none" context={context}>
			<TextField
				context={context}
				type="search"
				variant="uesio/io.search"
				placeholder={definition.placeholder || "Search"}
				setValue={(value) => {
					debouncedRequest(value as string)
				}}
			/>
		</FieldWrapper>
	)
}

export default SearchBox
