import { builder, component } from "@uesio/ui"
const PropList = component.getUtility("uesio/builder.proplist")

const PropListProp: builder.PropComponent<builder.PropListProp> = (props) => (
	<div style={{ padding: "8px" }}>
		<span style={{ fontSize: "0.8em" }}>{props.descriptor.label}</span>
		<div
			style={{
				borderLeft: "2px solid rgba(0, 0, 0, 0.2)",
				paddingLeft: "0.5em",
			}}
		>
			<PropList
				path={props.path + `["${props.descriptor.name}"]`}
				properties={props.descriptor.properties}
				{...props}
			/>
		</div>
	</div>
)

export default PropListProp
