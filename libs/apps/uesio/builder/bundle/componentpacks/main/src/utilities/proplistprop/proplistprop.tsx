import { builder } from "@uesio/ui"
import PropList from "../proplist/proplist"

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
				{...props}
				path={props.path + `["${props.descriptor.name}"]`}
				properties={props.descriptor.properties}
			/>
		</div>
	</div>
)

export default PropListProp
