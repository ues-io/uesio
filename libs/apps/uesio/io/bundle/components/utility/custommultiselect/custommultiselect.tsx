import { useState, FunctionComponent, ReactNode } from "react"
import { useMultipleSelection, useSelect } from "downshift"
import { definition, styles, component } from "@uesio/ui"
import { usePopper } from "react-popper"
import { IconUtilityProps } from "../icon/icon"

type CustomMultiSelectProps<T> = {
	value: T
	setValue: (value: T[]) => void
	litems: T[]
	itemToString: (item: T) => string
	itemRenderer: (
		item: T,
		index: number,
		highlightedIndex: number
	) => ReactNode
	tagRenderer: (item: T) => ReactNode
} & definition.BaseProps

const Icon = component.getUtility<IconUtilityProps>("uesio/io.icon")

const CustomMultiSelect: FunctionComponent<CustomMultiSelectProps<unknown>> = (
	props
) => {
	const {
		value,
		litems,
		setValue,
		itemToString,
		itemRenderer = (item) => <div>{itemToString(item)}</div>,
		tagRenderer = (item) => <div>{itemToString(item)}</div>,
		context,
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
				borderRadius: "4px",
				overflow: "hidden",
				boxShadow: "0 0 4px #00000033",
			},
			menuitem: {
				cursor: "pointer",
			},
			editbutton: {
				color: "#444",
				border: "none",
				outline: "none",
				padding: "6px 10px 6px 0",
				backgroundColor: "transparent",
				fontSize: "initial",
				cursor: "pointer",
			},
			selecteditem: {
				display: "inline-block",
				// border: "0.5px solid black",
				backgroundColor: "#f5f5f5",
				padding: "6px 10px",
				marginRight: "8px",
				borderRadius: "5px",
				verticalAlign: "middle",
			},
		},
		props
	)

	const {
		getDropdownProps,
		addSelectedItem,
		removeSelectedItem,
		selectedItems,
	} = useMultipleSelection({ initialSelectedItems: value as string[] })

	// function getFilter(selectedItems: string[]) {
	// 	return function filter(elem: string) {
	// 		return selectedItems.indexOf(elem) < 0
	// 	}
	// }

	// const items = litems.filter(getFilter(selectedItems))
	const items = litems.filter((elem: string) => !selectedItems.includes(elem))
	console.log({ selectedItems, litems, items })

	const {
		isOpen,
		getMenuProps,
		getToggleButtonProps,
		highlightedIndex,
		getItemProps,
		inputValue,
	} = useSelect({
		itemToString,
		items,
		selectedItem: null,
		stateReducer: (state, actionAndChanges) => {
			const { changes, type } = actionAndChanges
			switch (type) {
				case useSelect.stateChangeTypes.MenuKeyDownEnter:
				case useSelect.stateChangeTypes.MenuKeyDownSpaceButton:
				case useSelect.stateChangeTypes.ItemClick:
					return {
						...changes,
						isOpen: true, // keep the menu open after selection.
					}
			}
			return changes
		},
		onStateChange: ({ type, selectedItem }) => {
			switch (type) {
				case useSelect.stateChangeTypes.MenuKeyDownEnter:
				case useSelect.stateChangeTypes.MenuKeyDownSpaceButton:
				case useSelect.stateChangeTypes.ItemClick:
					if (selectedItem) {
						addSelectedItem(selectedItem as string) //TO-DO
					}
					break
				default:
					break
			}
		},
		onSelectedItemChange: (changes) => {
			const selectedItem = changes.selectedItem as string
			const lcopy = [...selectedItems]
			lcopy.push(selectedItem)
			setValue(lcopy)
		},
	})

	const [anchorEl, setAnchorEl] = useState<HTMLDivElement | null>(null)
	const [popperEl, setPopperEl] = useState<HTMLDivElement | null>(null)
	const popper = usePopper(anchorEl, popperEl, {
		placement: "bottom-start",
	})

	return (
		<div ref={setAnchorEl}>
			{selectedItems.map((selectedItem, index) => (
				<div
					className={classes.selecteditem}
					key={`${selectedItem}-${index}`}
				>
					{tagRenderer(selectedItem)}
					<button
						className={classes.editbutton}
						type="button"
						onClick={(e) => {
							e.stopPropagation()
							removeSelectedItem(selectedItem)
							setValue(
								selectedItems.filter(
									(elem) => elem === selectedItem
								)
							)
						}}
					>
						<Icon icon="close" context={context} />
					</button>
				</div>
			))}
			<button
				className={classes.editbutton}
				type="button"
				{...getToggleButtonProps(
					getDropdownProps({ preventKeyAction: isOpen })
				)}
			>
				<Icon icon="expand_more" context={context} />
			</button>

			<div
				ref={setPopperEl}
				style={{
					...popper.styles.popper,
					zIndex: "1",
					...(!isOpen && { visibility: "hidden" }),
				}}
				{...popper.attributes.popper}
				className={classes.menu}
			>
				<div {...getMenuProps()}>
					{isOpen &&
						items.map((item, index) => (
							<div
								className={classes.menuitem}
								key={index}
								{...getItemProps({ item, index })}
							>
								{itemRenderer(item, index, highlightedIndex)}
							</div>
						))}
				</div>
			</div>
		</div>
	)
}

export default CustomMultiSelect
