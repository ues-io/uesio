import { styles, api, metadata, definition } from "@uesio/ui"
import debounce from "lodash/debounce"

type SearchBoxDefinition = {
	placeholder?: string
	wire: string
	searchFields: metadata.MetadataKey[]
}

const SearchBox: definition.UC<SearchBoxDefinition> = (props) => {
	const { definition, context } = props
	const wire = api.wire.useWire(definition.wire, context)
	const classes = styles.useStyles(
		{
			root: {
				margin: "16px 0",
				fontSize: "9pt",
			},
			input: {
				padding: "8px",
			},
		},
		props
	)
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
		<div className={classes.root}>
			<input
				className={classes.input}
				type="search"
				placeholder={definition.placeholder || "Search"}
				onChange={(event) => {
					debouncedRequest(event.target.value)
				}}
			/>
		</div>
	)
}

export default SearchBox
