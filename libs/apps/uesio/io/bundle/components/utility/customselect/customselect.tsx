import { useState, FunctionComponent, ReactNode, MouseEvent } from "react"
import { useCombobox } from "downshift"
import { definition, styles, component } from "@uesio/ui"
import { usePopper } from "react-popper"
import { IconUtilityProps } from "../icon/icon"

type CustomSelectProps<T> = {
	value: T
	setValue: (value: T) => void
	items: T[]
	itemToString: (item: T) => string
	itemRenderer: (
		item: T,
		index: number,
		highlightedIndex: number
	) => ReactNode
	tagRenderer: (item: T) => ReactNode
} & definition.BaseProps

const Icon = component.getUtility<IconUtilityProps>("uesio/io.icon")

const CustomSelect: FunctionComponent<CustomSelectProps<unknown>> = (props) => {
	const {
		value,
		items,
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
				margin: "4px 0",
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
			displayarea: {
				flex: 1,
			},
			label: {
				display: "flex",
				alignItems: "center",
				border: "1px solid #00000044",
				cursor: "pointer",
			},
			searchbox: {
				minWidth: "200px",
				borderRadius: "4px",
				margin: "6px",
				padding: "6px",
				border: "1px solid #00000044",
				"::placeholder": {
					fontSize: "9pt",
					color: "#999",
				},
			},
		},
		props
	)

	const {
		isOpen,
		selectedItem,
		getMenuProps,
		getToggleButtonProps,
		getLabelProps,
		highlightedIndex,
		getItemProps,
		getInputProps,
		selectItem,
		inputValue,
		openMenu,
	} = useCombobox({
		itemToString,
		items,
		selectedItem: value,
		onSelectedItemChange: (changes) => {
			const selectedItem = changes.selectedItem
			selectedItem && setValue(selectedItem)
		},
	})

	const [anchorEl, setAnchorEl] = useState<HTMLDivElement | null>(null)
	const [popperEl, setPopperEl] = useState<HTMLDivElement | null>(null)
	const popper = usePopper(anchorEl, popperEl, {
		placement: "bottom-start",
	})

	return (
		<div ref={setAnchorEl}>
			<label {...getLabelProps()} className={classes.label}>
				<div
					onFocus={openMenu}
					tabIndex={isOpen ? -1 : 0}
					className={classes.displayarea}
				>
					{tagRenderer(selectedItem)}
				</div>
				{selectedItem && (
					<button
						tabIndex={-1}
						className={classes.editbutton}
						type="button"
						onClick={(event: MouseEvent) => {
							event.preventDefault() // Prevent the label from triggering
							setValue(undefined)
							selectItem(null)
						}}
					>
						<Icon icon="close" context={context} />
					</button>
				)}
				<button
					className={classes.editbutton}
					type="button"
					{...getToggleButtonProps()}
				>
					<Icon icon="expand_more" context={context} />
				</button>
			</label>
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
					{isOpen && (
						<>
							<div>
								<input
									type="text"
									autoFocus
									className={classes.searchbox}
									placeholder="Search..."
									{...getInputProps()}
								/>
							</div>
							{items
								.filter((item) =>
									itemToString(item).includes(inputValue)
								)
								.map((item, index) => (
									<div
										className={classes.menuitem}
										key={index}
										{...getItemProps({ item, index })}
									>
										{itemRenderer(
											item,
											index,
											highlightedIndex
										)}
									</div>
								))}
						</>
					)}
				</div>
			</div>
		</div>
	)
}

export default CustomSelect
