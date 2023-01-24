import { definition, styles } from "@uesio/ui"
import { ReactNode } from "react"

interface Props {
	searchTerm: string | undefined
	setSearchTerm: (searchTerm: string) => void
	actions?: ReactNode
}

const SearchArea: definition.UtilityComponent<Props> = (props) => {
	const { searchTerm, setSearchTerm, actions } = props

	const classes = styles.useUtilityStyles(
		{
			root: {
				display: "flex",
				padding: "8px",
				position: "relative",
				backgroundColor: "#fafafa",
				alignItems: "center",
				gap: "6px",
			},
			input: {
				flex: 1,
				fontSize: "8pt",
				padding: "6px 8px",
				borderRadius: "8px",
				border: "1px solid #ddd",
				color: "#777",
			},
			actions: {
				flex: 0,
			},
		},
		props
	)
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
