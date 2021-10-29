import { FunctionComponent } from "react"
import { definition, styles, component } from "@uesio/ui"
import { IconButtonUtilityProps } from "../io.iconbutton/iconbutton"
import { GroupUtilityProps } from "../io.group/group"

interface PaginatorUtilityProps extends definition.UtilityProps {
	currentPage: number
	maxPages: number
	setPage: (page: number) => void
}

const IconButton =
	component.registry.getUtility<IconButtonUtilityProps>("io.iconbutton")
const Group = component.registry.getUtility<GroupUtilityProps>("io.group")

const Paginator: FunctionComponent<PaginatorUtilityProps> = (props) => {
	const { currentPage, maxPages, setPage, context } = props
	const classes = styles.useUtilityStyles(
		{
			root: {
				display: "grid",
				justifyItems: "center",
				padding: "10px",
			},
			button: {},
			current: {
				display: "inline-block",
			},
		},
		props
	)

	const nextPage = () => {
		if (currentPage < maxPages - 1) setPage(currentPage + 1)
	}

	const prevPage = () => {
		if (currentPage > 0) setPage(currentPage - 1)
	}

	return (
		<div className={classes.root}>
			<Group alignItems="center" context={context}>
				<IconButton
					icon="navigate_before"
					onClick={prevPage}
					context={context}
				/>
				<div className={classes.current}>{currentPage + 1}</div>
				<IconButton
					icon="navigate_next"
					onClick={nextPage}
					context={context}
				/>
			</Group>
		</div>
	)
}

export { PaginatorUtilityProps }

export default Paginator
