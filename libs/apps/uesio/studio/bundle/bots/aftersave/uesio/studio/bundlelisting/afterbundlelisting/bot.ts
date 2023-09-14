import { AfterSaveBotApi, ChangeApi, FieldValue } from "@uesio/bots"
// @ts-ignore
function afterbundlelisting(bot: AfterSaveBotApi) {
	const historyChanges: Record<string, FieldValue>[] = []

	const getHistoryItem = (change: ChangeApi) => {
		const historyItem: Record<string, FieldValue> = {}
		const status = change.get("uesio/studio.status")
		const app = change.get("uesio/studio.app")
		historyItem["uesio/studio.actiontype"] = status
		historyItem["uesio/studio.app"] = app
		return historyItem
	}

	bot.inserts.get().forEach((change) => {
		const status = change.get("uesio/studio.status") as string
		if (status === "") {
			change.set("uesio/studio.status", "OPEN")
		}
		historyChanges.push(getHistoryItem(change))
	})

	bot.updates.get().forEach((change) => {
		const NewStatus = change.get("uesio/studio.status") as string
		const OldStatus = change.getOld("uesio/studio.status") as string

		if (OldStatus === "OPEN" && NewStatus === "SUBMITTED") {
			historyChanges.push(getHistoryItem(change))
			return
		}

		if (OldStatus === "SUBMITTED" && NewStatus === "IN_REVIEW") {
			return
		}

		if (
			OldStatus === "IN_REVIEW" &&
			(NewStatus === "REJECTED" || NewStatus === "APPROVED")
		) {
			return
		}

		if (OldStatus === "APPROVED" && NewStatus === "PUBLISHED") {
			historyChanges.push(getHistoryItem(change))
			return
		}

		if (OldStatus === "PUBLISHED" && NewStatus === "OPEN") {
			return
		}

		bot.addError(
			`Cannot change bundle listing status from ${OldStatus} to ${NewStatus}`
		)
	})

	if (historyChanges.length) {
		bot.save("uesio/studio.bundlelistinghistory", historyChanges as any)
	}
}
