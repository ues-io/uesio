import signals from "../utils/signals"
export default signals((state) => ({
	mode: state.mode === "READ" ? "EDIT" : "READ",
}))
