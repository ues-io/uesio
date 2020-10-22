import * as React from "react"
import { useCombobox } from "downshift"
import { material, definition } from "@uesio/ui"
import debounce from "lodash.debounce"

//TODO:: Come up with a better way to do this.
//Could not rely on state hooks because the value would
//be function scoped to that particular rendering of the component
//We need some way to know that the request options we are processing were
//from the very latest of the requests sent.
let HACKY_lastInputChange = 0

type DropDownProps = {
	value: string
	setValue: (value: string | null) => void
	getItems: (
		search: string,
		callback: (items: SelectedItem[]) => void
	) => void
} & definition.BaseProps

type SelectedItem = {
	id: string
	value: string
}

const AutoCompleteField = (props: DropDownProps): React.ReactElement | null => {
	const [loading, setLoading] = React.useState(false)
	const startingOptions: { value: string }[] = []
	const [inputItems, setInputItems] = React.useState(startingOptions)
	const options = loading ? [{ value: "loading..." }] : inputItems

	const debouncedRequest = debounce(props.getItems, 200)

	const {
		isOpen,
		getMenuProps,
		getInputProps,
		getComboboxProps,
		highlightedIndex,
		getItemProps,
	} = useCombobox({
		items: options,
		itemToString: (item) => {
			if (item) {
				return item.value
			}
			return ""
		},
		initialSelectedItem: {
			value: props.value,
		},
		onSelectedItemChange: (changes) => {
			const selectedItem = changes.selectedItem as SelectedItem
			if (!selectedItem) {
				return
			}
			props.setValue(selectedItem.id)
		},
		onInputValueChange: ({ inputValue, type }) => {
			HACKY_lastInputChange = Date.now()
			const inputChangeTimestamp = HACKY_lastInputChange

			if (type !== useCombobox.stateChangeTypes.InputChange) {
				//The user likely just selected an item.
				//Whatever we want to happen when a user selects an item should occur in
				//onSelectedItemChange
				return
			}
			//We cleared out the input - stop all loading
			if (!inputValue) {
				setLoading(false)
				setInputItems([])
				props.setValue(null)

				return
			}
			setLoading(true)
			debouncedRequest(inputValue, (result) => {
				//We had some request come in after the function had finished debouncing
				//but while previous the request was still in flight -
				//so we should do nothing

				if (inputChangeTimestamp < HACKY_lastInputChange) return
				HACKY_lastInputChange = 0
				setLoading(false)
				setInputItems(result)
			})
		},
	})

	return (
		<>
			<div {...getComboboxProps()}>
				<material.TextField {...getInputProps()} />
			</div>
			<material.List
				{...getMenuProps()}
				style={{ position: "absolute", zIndex: 1 }}
			>
				{isOpen &&
					options.map((item, index) => (
						<material.ListItem
							style={
								highlightedIndex === index
									? { backgroundColor: "#bde4ff" }
									: { backgroundColor: "white" }
							}
							key={`${item.value}${index}`}
							{...getItemProps({ item, index })}
						>
							<material.ListItemText primary={item.value} />
						</material.ListItem>
					))}
			</material.List>
		</>
	)
}

AutoCompleteField.displayName = "AutoCompleteField"

export { SelectedItem }

export default AutoCompleteField
