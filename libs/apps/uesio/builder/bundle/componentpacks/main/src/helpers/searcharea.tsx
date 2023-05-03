import { definition, styles } from "@uesio/ui"
import { ReactNode } from "react"

interface Props {
	searchTerm: string | undefined
	setSearchTerm: (searchTerm: string) => void
	actions?: ReactNode
}

const StyleDefaults = Object.freeze({
	root: ["flex", "p-2", "relative", "bg-slate-50", "align-center", "gap-2"],
	input: [
		"grow",
		"text-xs",
		"px-2",
		"py-1.5",
		"rounded",
		"border",
		"border-slate-200",
		"text-slate-700",
		"outline-offset-0",
	],
	actions: ["grow-0"],
})

const SearchArea: definition.UtilityComponent<Props> = (props) => {
	const { searchTerm, setSearchTerm, actions } = props

	const classes = styles.useUtilityStyleTokens(StyleDefaults, props)
	return (
		<div className={classes.root}>
			<input
				autoFocus
				className={classes.input}
				value={searchTerm || ""}
				onChange={(e) => setSearchTerm(e.target.value.toLowerCase())}
				type="search"
				placeholder="Search..."
			/>
			{actions && <div className={classes.actions}>{actions}</div>}
		</div>
	)
}

export default SearchArea
