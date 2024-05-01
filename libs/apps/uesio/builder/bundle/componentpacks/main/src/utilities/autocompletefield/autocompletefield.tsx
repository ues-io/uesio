import { useState, ReactNode, useRef } from "react"
import { definition, styles } from "@uesio/ui"
import {
	autoPlacement,
	useFloating,
	autoUpdate,
	offset,
	FloatingPortal,
	useListNavigation,
	useInteractions,
	useDismiss,
	useClick,
	useRole,
	FloatingFocusManager,
} from "@floating-ui/react"

interface AutocompleteFieldUtilityProps<T> {
	itemRenderer: (item: T) => ReactNode
	onSelect: (item: T) => void
	getItemKey: (item: T) => string
	onSearch?: (search: string) => Promise<T[]>
	searchFilter?: (item: T, search: string) => boolean
	placeholder?: string
	closeOnSelect?: boolean
	open?: boolean
	maxDisplayItems?: number
}

const StyleDefaults = Object.freeze({
	root: [],
	menu: [],
	menuheader: [],
	menuitem: [],
	highlighted: [],
	searchbox: [],
	itemsarea: [],
})

const AutocompleteField: definition.UtilityComponent<
	AutocompleteFieldUtilityProps<unknown>
> = (props) => {
	const {
		context,
		itemRenderer,
		onSelect,
		onSearch,
		searchFilter,
		getItemKey,
		closeOnSelect = true,
		placeholder,
		id,
		open = false,
		maxDisplayItems = 20,
	} = props
	const classes = styles.useUtilityStyleTokens(
		StyleDefaults,
		props,
		"uesio/io.listmenu"
	)

	const [isOpen, setIsOpen] = useState(open)
	const [searchText, setSearchText] = useState("")
	const [items, setItems] = useState<unknown[] | undefined>([])

	const getSearchItems = async (newSearchText: string) => {
		if (newSearchText !== searchText) {
			const results = await onSearch?.(newSearchText)
			if (results && results.length) {
				// Only return first N items of array
				setItems(results.slice(0, maxDisplayItems))
				setSearchText(newSearchText)
			}
		}
	}

	const onOpenChange = (open: boolean) => {
		if (open !== isOpen) {
			setIsOpen(open)
		}
	}

	const floating = useFloating({
		open: isOpen,
		onOpenChange,
		placement: "bottom-start",
		middleware: [
			offset(2),
			autoPlacement({ allowedPlacements: ["top-start", "bottom-start"] }),
		],
		whileElementsMounted: autoUpdate,
	})

	const { x, y, strategy, refs } = floating

	const listRef = useRef<(HTMLDivElement | null)[]>([])

	const [activeIndex, setActiveIndex] = useState<number | null>(null)

	const dismiss = useDismiss(floating.context)
	const click = useClick(floating.context)
	const role = useRole(floating.context, { role: "listbox" })

	const listNavigation = useListNavigation(floating.context, {
		listRef,
		activeIndex,
		onNavigate: setActiveIndex,
		focusItemOnOpen: false,
		focusItemOnHover: false,
	})

	const { getReferenceProps, getFloatingProps, getItemProps } =
		useInteractions([click, dismiss, role, listNavigation])

	return (
		<>
			<div
				className="flex"
				tabIndex={0}
				id={id}
				ref={refs.setReference}
				{...getReferenceProps()}
			>
				<input
					type="text"
					value={searchText}
					autoFocus
					className={classes.searchbox}
					placeholder={
						placeholder ||
						`${context.getLabel("uesio/io.search")}...`
					}
					onChange={(e) => {
						if (!isOpen && e.target.value?.length) {
							setIsOpen(true)
						}
						getSearchItems(e.target.value)
					}}
				/>
			</div>

			{isOpen && (
				<FloatingPortal>
					<FloatingFocusManager
						context={floating.context}
						modal={false}
					>
						<div
							ref={refs.setFloating}
							style={{
								position: strategy,
								top: y ?? 0,
								left: x ?? 0,
							}}
							className={classes.menu}
							{...getFloatingProps()}
						>
							<div className={classes.itemsarea}>
								{items
									?.filter((item) => {
										if (!searchFilter) return true
										if (!searchText) return true
										return searchFilter(item, searchText)
									})
									?.map((item, index) => (
										<div
											className={styles.cx(
												classes.menuitem,
												activeIndex === index &&
													classes.highlighted
											)}
											key={getItemKey(item)}
											tabIndex={
												activeIndex === index ? 0 : -1
											}
											ref={(node) => {
												listRef.current[index] = node
											}}
											role="option"
											{...getItemProps({
												// Handle pointer select.
												onClick() {
													onSelect(item)
													closeOnSelect &&
														setIsOpen(false)
												},
												// Handle keyboard select.
												onKeyDown(event) {
													if (event.key === "Enter") {
														event.preventDefault()
														onSelect(item)
														closeOnSelect &&
															setIsOpen(false)
													}
												},
											})}
										>
											{itemRenderer(item)}
										</div>
									))}
							</div>
						</div>
					</FloatingFocusManager>
				</FloatingPortal>
			)}
		</>
	)
}

export default AutocompleteField
