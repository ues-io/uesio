import { definition, component, api } from "@uesio/ui"

type ImpersonationDefinition = {
	workspaceID: string
}

const Impersonation: definition.UC<ImpersonationDefinition> = (props) => {
	const { context, definition } = props
	const workspaceID = context.mergeString(definition.workspaceID)
	if (!workspaceID) throw new Error("No Workspace ID Provided")
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
					field: "uesio/studio.workspace",
					value: workspaceID,
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
						// Need to clear these contexts before calling navigate,
						// so that the path is not prefixed with the workspace/site prefix
						{
							signal: "context/CLEAR",
							type: "WORKSPACE",
						},
						{
							signal: "context/CLEAR",
							type: "SITE_ADMIN",
						},
						{
							signal: "context/CLEAR",
							type: "SITE",
						},
						{
							signal: "bot/CALL",
							bot: "uesio/studio.setworkspaceuser",
							params: {
								workspaceid: workspaceID,
								profile: "${uesio/studio.profile}",
							},
						},
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
							variant: "uesio/builder.propfield",
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
