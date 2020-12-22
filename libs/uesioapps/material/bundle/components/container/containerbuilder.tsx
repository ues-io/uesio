import { FunctionComponent } from "react";
import { hooks } from "@uesio/ui"
import { ContainerProps, ContainerDefinition } from "./containerdefinition"
import Container from "./container"

const ContainerBuilder: FunctionComponent<ContainerProps> = (props) => {
	const uesio = hooks.useUesio(props)
	const definition = uesio.view.useDefinition(
		props.path
	) as ContainerDefinition
	return <Container {...props} definition={definition} />
}

export default ContainerBuilder
