import { FunctionComponent, RefObject, useRef } from "react"
import { BaseProps, DefinitionMap } from "../definition/definition"

type PanelInfo = {
	domNode: RefObject<HTMLDivElement>
	definition: DefinitionMap | undefined
	componentType: string
}

const panelRegistry: Record<string, PanelInfo> = {}

const Panel: FunctionComponent<BaseProps> = (props) => {
	const panelId = props.definition?.id as string
	const ref = useRef<HTMLDivElement>(null)
	if (!props.componentType) return null
	panelRegistry[panelId] = {
		domNode: ref,
		definition: props.definition,
		componentType: props.componentType,
	}
	return <div ref={ref} />
}

export { panelRegistry }
export default Panel
