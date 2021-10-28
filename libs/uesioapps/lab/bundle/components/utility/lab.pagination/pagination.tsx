import { definition, styles, component, builder, context } from "@uesio/ui"
import { FC } from "react"

const Icon = component.registry.getUtility("io.icon")

type T = {
	classes: Record<string, any>
	onPageChange: (direction: "prev" | "next") => void
	context: context.Context
	currentPage: number
	lastPage: number
}

const PaginationNav: FC<T> = ({
	classes,
	onPageChange,
	context,
	currentPage,
	lastPage,
}) => (
	<div className={classes.root}>
		<button
			disabled={currentPage === 0}
			onClick={() => onPageChange("prev")}
		>
			<Icon context={context} icon="chevron_left" />
			Down
		</button>
		<span className={classes.pageNumber}>{currentPage}</span>
		<button
			disabled={currentPage === lastPage}
			onClick={() => onPageChange("next")}
		>
			Up
			<Icon context={context} icon="chevron_right" />
		</button>
	</div>
)

export default PaginationNav
