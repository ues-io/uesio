import { useState, useRef, FunctionComponent } from "react"
import { useCombobox } from "downshift"
import { material, definition } from "@uesio/ui"
import debounce from "lodash.debounce"

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

const AutoCompleteField: FunctionComponent<DropDownProps> = ({
	getItems,
	value,
	setValue,
}) => {
	const [loading, setLoading] = useState(false)
	const [inputItems, setInputItems] = useState<{ value: string }[]>([])
	const lastInputChange = useRef<number>(0)

	const options = loading ? [{ value: "loading..." }] : inputItems
	const debouncedRequest = debounce(getItems, 200)

	const {
		isOpen,
		getMenuProps,
		getInputProps,
		getComboboxProps,
		highlightedIndex,
		getItemProps,
	} = useCombobox({
		items: options,
		itemToString: (item) => (item ? item.value : ""),
		initialSelectedItem: { value },
		onSelectedItemChange: (changes) => {
			const selectedItem = changes.selectedItem as SelectedItem
			selectedItem && setValue(selectedItem.id)
		},
		onInputValueChange: ({ inputValue, type }) => {
			lastInputChange.current = Date.now()
			const inputChangeTimestamp = lastInputChange.current

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
				setValue(null)

				return
			}
			setLoading(true)
			debouncedRequest(inputValue, (result) => {
				//We had some request come in after the function had finished debouncing
				//but while previous the request was still in flight -
				//so we should do nothing

				if (inputChangeTimestamp < lastInputChange.current) return
				lastInputChange.current = 0
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
