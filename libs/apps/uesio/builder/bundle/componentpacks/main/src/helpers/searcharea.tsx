import { definition, styles } from "@uesio/ui"
import { ReactNode } from "react"

interface Props {
	id?: string
	placeholder?: string
	searchTerm: string | undefined
	setSearchTerm: (searchTerm: string) => void
	onSelect?: (value: string) => void
	actions?: ReactNode
}

const StyleDefaults = Object.freeze({
	root: ["flex", "p-2", "relative", "align-center", "gap-2"],
	input: [
		"grow",
		"text-xs",
		"px-2",
		"py-1.5",
		"font-light",
		"rounded",
		"bg-slate-800",
		"text-slate-300",
		"outline-offset-0",
	],
	actions: ["grow-0"],
})

const SearchArea: definition.UtilityComponent<Props> = (props) => {
	const {
		context,
		id,
		searchTerm,
		setSearchTerm,
		actions,
		onSelect,
		placeholder,
	} = props

	const classes = styles.useUtilityStyleTokens(StyleDefaults, props)
	return (
		<div className={classes.root}>
			<input
				autoFocus
				className={classes.input}
				id={id}
				value={searchTerm || ""}
				onChange={(e) => setSearchTerm(e.target.value.toLowerCase())}
				type="search"
				placeholder={
					placeholder || `${context.getLabel("uesio/io.search")}...`
				}
				onKeyPress={(e) => {
					if (e.key === "Enter" && onSelect) {
						e.preventDefault()
						e.stopPropagation()
						onSelect(e.currentTarget.value)
					}
				}}
			/>
			{actions && <div className={classes.actions}>{actions}</div>}
		</div>
	)
}

export default SearchArea
