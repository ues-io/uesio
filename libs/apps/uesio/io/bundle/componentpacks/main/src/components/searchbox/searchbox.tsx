import { api, context, wire, definition, metadata, styles } from "@uesio/ui"
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
	noValueBehavior?: wire.NoValueBehavior
}

const StyleDefaults = Object.freeze({
	root: [],
})

const search = (
	searchValue: string,
	wire: string,
	searchFields: string[],
	noValueBehavior: wire.NoValueBehavior,
	context: context.Context
) => {
	api.signal.run(
		{
			signal: "wire/SEARCH",
			search: searchValue,
			wire,
			searchFields,
			noValueBehavior,
		},
		context
	)
}

const SearchBox: definition.UC<SearchBoxDefinition> = (props) => {
	const { definition, context } = props
	const {
		placeholder = props.context.getLabel("uesio/io.search"),
		searchFields,
		focusOnRender = false,
		fieldVariant = "uesio/io.search",
		noValueBehavior,
	} = definition

	const [text, setText] = useState("")

	const classes = styles.useStyleTokens(StyleDefaults, props)

	const debouncedSearch = useMemo(
		() =>
			debounce(
				(searchText: string) =>
					search(
						searchText,
						definition.wire,
						searchFields,
						noValueBehavior,
						context
					),

				500
			),
		[definition.wire, searchFields, noValueBehavior, context]
	)

	useEffect(
		() => () => {
			debouncedSearch.cancel()
		},
		[definition.wire, searchFields, debouncedSearch]
	)

	const wire = api.wire.useWire(definition.wire, context)
	if (!wire) return null

	const existingCondition = (wire.getCondition("uesio.search") ||
		undefined) as wire.SearchConditionState

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
				variant={fieldVariant}
				placeholder={context.mergeString(placeholder)}
				setValue={(value: string) => {
					setText(value)
					debouncedSearch(value)
				}}
				value={context.merge(existingCondition?.value || text)}
				focusOnRender={focusOnRender}
			/>
		</FieldWrapper>
	)
}

export default SearchBox
