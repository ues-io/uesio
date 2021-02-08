import signals from "../utils/signals"
export default signals((state) => ({
	mode: state.mode === "OPEN" ? "CLOSE" : "OPEN",
}))
