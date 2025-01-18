import { FunctionComponent } from "react"
import { BaseProps } from "../definition/definition"

const NotFound: FunctionComponent<BaseProps> = (props) => (
  <div>Component Not Found: {props.componentType}</div>
)

export default NotFound
