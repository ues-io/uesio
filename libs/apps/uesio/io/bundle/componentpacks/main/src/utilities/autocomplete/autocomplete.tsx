import { useState, useRef, FunctionComponent, ReactNode } from "react"
import { useCombobox } from "downshift"
import { definition, styles } from "@uesio/ui"
import { usePopper } from "react-popper"
import debounce from "lodash/debounce"

type DropDownProps<T> = {
	value: T
	setValue: (value: T) => void
	getItems: (search: string, callback: (items: T[]) => void) => void
	itemToString: (item: T) => string
	loadingRenderer?: () => ReactNode
	itemRenderer: (
		item: T,
		index: number,
		highlightedIndex: number
	) => ReactNode
	placeholder?: string
} & definition.UtilityProps

const AutoCompleteField: FunctionComponent<DropDownProps<unknown>> = (
	props
) => {
	const {
		getItems,
		value,
		setValue,
		itemToString,
		loadingRenderer = () => (
			<div className={classes.menuitem}>Loading...</div>
		),
		itemRenderer = (item) => <div>{itemToString(item)}</div>,
		placeholder,
	} = props

	const classes = styles.useUtilityStyles(
		{
			root: {},
			input: {},
			readonly: {},
			menu: {
				backgroundColor: "white",
				fontSize: "10pt",
				border: "1px solid #ccc",
				borderTop: "0",
				width: "100%",
			},
			menuitem: {
				padding: "10px",
				borderBottom: "1px solid #ccc",
				cursor: "pointer",
				"&:last-child": {
					borderBottom: 0,
				},
			},
		},
		props
	)
	const [loading, setLoading] = useState(false)
	const [inputItems, setInputItems] = useState<unknown[]>([])
	const lastInputChange = useRef<number>(0)
	const debouncedRequest = useRef(debounce(getItems, 250)).current

	const {
		isOpen,
		getMenuProps,
		getInputProps,
		getComboboxProps,
		highlightedIndex,
		getItemProps,
	} = useCombobox({
		items: inputItems,
		itemToString,
		selectedItem: value,
		onSelectedItemChange: (changes) => {
			const selectedItem = changes.selectedItem
			selectedItem && setValue(selectedItem)
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

	const [anchorEl, setAnchorEl] = useState<HTMLDivElement | null>(null)
	const [popperEl, setPopperEl] = useState<HTMLDivElement | null>(null)
	const popper = usePopper(anchorEl, popperEl, {
		placement: "bottom-start",
	})

	return (
		<div ref={setAnchorEl}>
			<div className={classes.root} {...getComboboxProps()}>
				<input
					className={classes.input}
					{...getInputProps()}
					placeholder={placeholder}
				/>
			</div>

			<div
				ref={setPopperEl}
				style={popper.styles.popper}
				{...popper.attributes.popper}
			>
				<div
					className={classes.menu}
					style={{ ...(!isOpen && { visibility: "hidden" }) }}
					{...getMenuProps()}
				>
					{isOpen &&
						(loading
							? loadingRenderer()
							: inputItems.map((item, index) => (
									<div
										className={classes.menuitem}
										key={itemToString(item) + "_" + index}
										{...getItemProps({ item, index })}
									>
										{itemRenderer(
											item,
											index,
											highlightedIndex
										)}
									</div>
							  )))}
				</div>
			</div>
		</div>
	)
}

export default AutoCompleteField
