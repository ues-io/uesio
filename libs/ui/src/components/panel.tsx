import { FunctionComponent, RefObject, useEffect, useRef } from "react"
import { BaseProps, DefinitionMap } from "../definition/definition"
import { useUesio } from "../hooks/hooks"
import { set as setPanel } from "../bands/panel"

type PanelInfo = {
	domNode: RefObject<HTMLDivElement>
	definition: DefinitionMap | undefined
}

const panelRegistry: Record<string, PanelInfo> = {}

const Panel: FunctionComponent<BaseProps> = (props) => {
	const uesio = useUesio(props)
	const panelId = props.definition?.id as string
	const ref = useRef<HTMLDivElement>(null)

	useEffect(() => {
		uesio.getDispatcher()(
			setPanel({
				id: panelId,
				contextPath: "",
			})
		)
		panelRegistry[panelId] = {
			domNode: ref,
			definition: props.definition,
		}
	}, [])
	return <div ref={ref} />
}

export { panelRegistry }
export default Panel
