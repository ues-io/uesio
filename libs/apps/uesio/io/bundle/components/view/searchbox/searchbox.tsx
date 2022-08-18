import { ChangeEvent, FunctionComponent } from "react"

import { SearchBoxProps } from "./searchboxdefinition"
import { styles, hooks } from "@uesio/ui"
import debounce from "lodash/debounce"

const SearchBox: FunctionComponent<SearchBoxProps> = (props) => {
	const { definition, context } = props
	const uesio = hooks.useUesio(props)
	const wire = uesio.wire.useWire(definition.wire)
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
		uesio.signal.run(
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
				onChange={(event: ChangeEvent<HTMLInputElement>): void => {
					debouncedRequest(event.target.value)
				}}
			/>
		</div>
	)
}

export default SearchBox
