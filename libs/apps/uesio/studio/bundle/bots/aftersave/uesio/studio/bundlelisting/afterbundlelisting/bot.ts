import { AfterSaveBotApi } from "@uesio/bots"
// @ts-ignore
function afterbundlelisting(bot: AfterSaveBotApi) {
	bot.inserts.get().forEach((change) => {
		const status = change.get("uesio/studio.status") as string
		if (status !== "OPEN") {
			bot.addError("On creation the status must be open")
		}
	})
	bot.updates.get().forEach((change) => {
		const NewStatus = change.get("uesio/studio.status") as string
		const OldStatus = change.getOld("uesio/studio.status") as string

		//allowed transitions
		if (OldStatus === "OPEN" && NewStatus === "SUBMITTED") {
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
			return
		}

		//in case we want to remove it from the store
		if (OldStatus === "PUBLISHED" && NewStatus === "OPEN") {
			return
		}

		bot.addError("Invalid Transition")
	})
}
