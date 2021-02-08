import signals from "../utils/signals"
import { FormState } from "./formdefinition"

export default signals<FormState>((state: FormState) => ({
	mode: state.mode === "READ" ? "EDIT" : "READ",
}))
