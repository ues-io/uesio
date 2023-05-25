import { api, metadata, definition, context } from "@uesio/ui"
import debounce from "lodash/debounce"
import TextField from "../../utilities/field/text"
import FieldWrapper from "../../utilities/fieldwrapper/fieldwrapper"
import { useEffect, useMemo, useState } from "react"

type SearchBoxDefinition = {
	wire: string
	searchFields: metadata.MetadataKey[]
	focusOnRender?: boolean
	placeholder?: string
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
	const {
		definition: {
			placeholder = "Search",
			searchFields,
			wire,
			focusOnRender = false,
		},
		context,
	} = props
	const [text, setText] = useState("")

	const debouncedSearch = useMemo(
		() =>
			debounce(
				(searchText: string) =>
					search(searchText, wire, searchFields, context),
				300
			),
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[wire, searchFields]
	)

	useEffect(
		() => () => {
			debouncedSearch.cancel()
		},
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[wire, searchFields]
	)

	return (
		<FieldWrapper labelPosition="none" context={context}>
			<TextField
				context={context}
				type="search"
				variant="uesio/io.search"
				placeholder={placeholder}
				setValue={(value: string) => {
					setText(value)
					debouncedSearch(value)
				}}
				value={text}
				focusOnRender={focusOnRender}
			/>
		</FieldWrapper>
	)
}

export default SearchBox
