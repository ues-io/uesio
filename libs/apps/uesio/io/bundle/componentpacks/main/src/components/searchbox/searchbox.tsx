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

/*

const SearchBoxPropertyDefinition: builder.BuildPropertiesDefinition = {
	title: "Search Box",
	description: "Filter a wire based on a user's text search.",
	link: "https://docs.ues.io/",
	defaultDefinition: () => ({}),
	properties: [
		{
			name: "wire",
			type: "WIRE",
			label: "Wire",
		},
		{
			name: "searchFields",
			type: "FIELDS",
			label: "Search Fields",
			wireField: "wire",
		},
		{
			name: "placeholder",
			type: "TEXT",
			label: "Placeholder",
		},
	],
	sections: [],
	actions: [],
	traits: ["uesio.standalone"],
	classes: ["root"],
	type: "component",
	category: "INTERACTION",
}
*/

export default SearchBox
