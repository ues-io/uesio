import { component, definition } from "@uesio/ui"
import groupBy from "lodash/groupBy"

const getAssignmentButton = (
	collection: string,
	icon: string,
	viewtype: string
) => ({
	"uesio/io.tile": {
		"uesio.variant": "uesio/io.nav",
		"uesio.styleTokens": {
			avatar: ["text-sm"],
			root: ["p-1.5"],
		},
		avatar: [
			{
				"uesio/io.text": {
					"uesio.variant": "uesio/io.icon",
					text: icon,
				},
			},
		],
		signals: [
			{
				signal: "route/NAVIGATE_TO_ASSIGNMENT",
				collection,
				viewtype,
			},
		],
	},
})

const SiteNav: definition.UC = (props) => {
	const { context, path } = props

	const routeAssignments = context.getRouteAssignments()

	const assignmentsByCollection = groupBy(routeAssignments, "collection")

	return (
		<>
			{Object.entries(assignmentsByCollection).map(
				([collection, assignments]) => {
					const assignmentsByType = groupBy(assignments, "type")
					const listAssignment = assignmentsByType.list?.[0]
					const createNewAssignment = assignmentsByType.createnew?.[0]
					const consoleAssignment = assignmentsByType.console?.[0]
					const primaryAssignment = listAssignment || assignments[0]

					return (
						<component.Component
							path={path}
							context={context}
							componentType="uesio/io.box"
							definition={{
								"uesio.styleTokens": {
									root: ["flex", "gap-2", "items-center"],
								},
								components: [
									{
										"uesio/io.tile": {
											"uesio.variant": "uesio/io.nav",
											"uesio.styleTokens": {
												root: ["flex", "grow"],
											},
											content: [
												{
													"uesio/io.text": {
														text: primaryAssignment.collectionPluralLabel,
													},
												},
											],
											avatar: [
												{
													"uesio/io.text": {
														"uesio.variant":
															"uesio/io.icon",
														text: "view_list",
													},
												},
											],
											signals: listAssignment
												? [
														{
															signal: "route/NAVIGATE_TO_ASSIGNMENT",
															collection,
														},
													]
												: undefined,
										},
									},
									{
										...(consoleAssignment &&
											getAssignmentButton(
												collection,
												"dock_to_right",
												"console"
											)),
									},
									{
										...(createNewAssignment &&
											getAssignmentButton(
												collection,
												"add",
												"createnew"
											)),
									},
								],
							}}
							key={collection}
						/>
					)
				}
			)}
		</>
	)
}

export default SiteNav
