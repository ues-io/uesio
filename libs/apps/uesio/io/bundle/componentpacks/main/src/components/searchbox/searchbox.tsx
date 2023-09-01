import {
	api,
	component,
	context,
	definition,
	metadata,
	styles,
} from "@uesio/ui"
import debounce from "lodash/debounce"
import TextField from "../../utilities/field/text"
import FieldWrapper from "../../utilities/fieldwrapper/fieldwrapper"
import { useEffect, useMemo, useState } from "react"

type SearchBoxDefinition = {
	wire: string
	searchFields: metadata.MetadataKey[]
	focusOnRender?: boolean
	placeholder?: string
	fieldVariant?: metadata.MetadataKey
}

const StyleDefaults = Object.freeze({
	root: [],
	input: [],
})

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
			placeholder = props.context.getLabel("uesio/io.search"),
			searchFields,
			wire,
			focusOnRender = false,
			fieldVariant = "uesio/io.search",
		},
		context,
	} = props
	const [text, setText] = useState("")

	const classes = styles.useStyleTokens(StyleDefaults, props)

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
		<FieldWrapper
			labelPosition="none"
			context={context}
			className={classes.root}
		>
			<TextField
				id={api.component.getComponentIdFromProps(props)}
				context={context}
				type="search"
				className={classes.input}
				variant={fieldVariant}
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
