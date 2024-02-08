import { component, definition } from "@uesio/ui"
import groupBy from "lodash/groupBy"

const SiteNav: definition.UC = (props) => {
	const { context, path } = props

	const routeAssignments = context.getRouteAssignments()

	const assignmentsByCollection = groupBy(routeAssignments, "collection")

	return (
		<>
			{Object.entries(assignmentsByCollection).map(
				([collection, assignments]) => (
					<component.Component
						path={path}
						context={context}
						componentType="uesio/io.tile"
						definition={{
							"uesio.variant": "uesio/io.nav",
							content: [
								{
									"uesio/io.text": {
										text: assignments[0]
											.collectionPluralLabel,
									},
								},
							],
							avatar: [
								{
									"uesio/io.text": {
										"uesio.variant": "uesio/io.icon",
										text: "view_list",
									},
								},
							],
							signals: [
								{
									signal: "route/NAVIGATE_TO_ASSIGNMENT",
									collection,
								},
							],
						}}
						key={collection}
					/>
				)
			)}
		</>
	)
}

export default SiteNav
