import { FunctionComponent } from "react"
import { SectionRendererProps } from "./sectionrendererdefinition"
import { builder, component } from "@uesio/ui"

const PropList = component.getUtility("uesio/builder.proplist")

const PropListSection: FunctionComponent<SectionRendererProps> = (props) => {
	const { path, definition, context, propsDef, valueAPI } = props
	const section = props.section as builder.PropListSection

	return (
		<>
			{section.properties && (
				<PropList
					path={path}
					definition={definition}
					propsDef={propsDef}
					properties={section.properties}
					context={context}
					valueAPI={valueAPI}
				/>
			)}
		</>
	)
}

export default PropListSection
