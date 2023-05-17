import { api, metadata, definition, context } from "@uesio/ui"
import debounce from "lodash/debounce"
import TextField from "../../utilities/field/text"
import FieldWrapper from "../../utilities/fieldwrapper/fieldwrapper"
import { useEffect, useMemo, useState } from "react"

type SearchBoxDefinition = {
	placeholder?: string
	wire: string
	searchFields: metadata.MetadataKey[]
}

const search = (
	searchValue: string,
	wire: string,
	searchFields: string[],
	context: context.Context
) => {
	api.signal.run(
		{
			signal: "wire/SEARCH",
			search: searchValue,
			wire,
			searchFields,
		},
		context
	)
}

const SearchBox: definition.UC<SearchBoxDefinition> = (props) => {
	const { definition, context } = props
	const [text, setText] = useState("")

	const debouncedSearch = useMemo(
		() =>
			debounce(
				(searchText: string) =>
					search(
						searchText,
						definition.wire,
						definition.searchFields,
						context
					),
				300
			),
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[definition.wire, definition.searchFields]
	)

	useEffect(
		() => () => {
			debouncedSearch.cancel()
		},
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[definition.wire, definition.searchFields]
	)

	return (
		<FieldWrapper labelPosition="none" context={context}>
			<TextField
				context={context}
				type="search"
				variant="uesio/io.search"
				placeholder={definition.placeholder || "Search"}
				setValue={(value: string) => {
					setText(value)
					debouncedSearch(value)
				}}
				value={text}
			/>
		</FieldWrapper>
	)
}

export default SearchBox
