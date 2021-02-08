import signals from "../utils/signals"
import { FormState } from "./formdefinition"

export default signals<FormState>((state) => ({
	mode: state.mode === "READ" ? "EDIT" : "READ",
}))
