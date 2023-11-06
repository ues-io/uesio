import { definition, component, api } from "@uesio/ui"

const Impersonation: definition.UtilityComponent = (props) => {
	const { context } = props
	const workspace = context.getWorkspace()
	if (!workspace) throw new Error("No Workspace Context Provided")

	const user = context.getUser()
	if (!user) throw new Error("No User Context Provided")

	const dataWire = api.wire.useDynamicWire(
		"impersonationWire",
		{
			collection: "uesio/studio.workspaceuser",
			fields: {
				"uesio/core.id": {},
				"uesio/studio.user": {},
				"uesio/studio.profile": {},
				"uesio/studio.workspace": {},
			},
			conditions: [
				{
					field: "uesio/studio.workspace->uesio/core.uniquekey",
					value: workspace.app + ":" + workspace.name,
					operator: "EQ",
					valueSource: "VALUE",
				},
				{
					field: "uesio/studio.user",
					value: user.id,
					operator: "EQ",
					valueSource: "VALUE",
				},
			],
			events: [
				{
					type: "onChange",
					fields: ["uesio/studio.profile"],
					signals: [
						{ signal: "WIRE/SAVE", wire: "impersonationWire" },
					],
				},
			],
		},
		context.deleteWorkspace()
	)

	if (!dataWire) return null

	return (
		<component.Component
			componentType={"uesio/io.item"}
			path=""
			definition={{
				wire: "impersonationWire",
				mode: "EDIT",
				components: [
					{
						"uesio/io.field": {
							labelPosition: "none",
							fieldId: "uesio/studio.profile",
						},
					},
				],
			}}
			context={context}
		/>
	)
}

export default Impersonation
