import { ListenerBotApi, WireRecord } from "@uesio/bots"

export default function call_crud(bot: ListenerBotApi) {
	// Save a new animal
	bot.save("uesio/tests.animal", [
		{
			"uesio/tests.genus": "Florvious",
			"uesio/tests.species": "Dorvious",
		},
	] as unknown as WireRecord[])

	// Check to see if it saved correctly
	const loadresult = bot.load({
		collection: "uesio/tests.animal",
		conditions: [
			{
				field: "uesio/core.uniquekey",
				value: "Florvious:Dorvious",
				operator: "EQ",
			},
		],
	})

	bot.log.info("calling crud", loadresult)

	if (loadresult.length !== 1) {
		throw new Error("Initial insert failed")
	}

	const recordid = (loadresult[0] as unknown as Record<string, unknown>)[
		"uesio/core.id"
	]

	// Now update the record
	// Save a new animal
	bot.save("uesio/tests.animal", [
		{
			"uesio/core.id": recordid,
			"uesio/tests.genus": "Florvious",
			"uesio/tests.species": "Dworvious",
		},
	] as unknown as WireRecord[])

	// Verify that the old record no longer exists with that key
	const loadresult2 = bot.load({
		collection: "uesio/tests.animal",
		conditions: [
			{
				field: "uesio/core.uniquekey",
				value: "Florvious:Dorvious",
				operator: "EQ",
			},
		],
	})

	if (loadresult2.length !== 0) {
		throw new Error(
			"Update didn't change the unique key from Florvious:Dorvious"
		)
	}

	// Verify that the changed record exists
	const loadresult3 = bot.load({
		collection: "uesio/tests.animal",
		conditions: [
			{
				field: "uesio/core.uniquekey",
				value: "Florvious:Dworvious",
				operator: "EQ",
			},
		],
	})

	if (loadresult3.length !== 1) {
		throw new Error(
			"Update didn't change the unique key to Florvious:Dworvious"
		)
	}

	// Now delete the item
	bot.delete("uesio/tests.animal", [
		{
			"uesio/core.id": recordid,
		},
	] as unknown as WireRecord[])

	// Now verify that it was deleted
	const loadresult4 = bot.load({
		collection: "uesio/tests.animal",
		conditions: [
			{
				field: "uesio/core.uniquekey",
				value: "Florvious:Dworvious",
				operator: "EQ",
			},
		],
	})

	if (loadresult4.length !== 0) {
		throw new Error("The delete was not successful in remove the item")
	}

	// Now make sure we have metadata
	const metadataResult = bot.getCollectionMetadata("uesio/tests.animal")
	if (
		!metadataResult ||
		metadataResult.name !== "animal" ||
		metadataResult.namespace !== "uesio/tests"
	) {
		throw new Error("The collection metadata request was unsuccessful")
	}

	const genusFieldMetadata =
		metadataResult.getFieldMetadata("uesio/tests.genus")
	if (
		!genusFieldMetadata ||
		genusFieldMetadata.name !== "genus" ||
		genusFieldMetadata.namespace !== "uesio/tests" ||
		genusFieldMetadata.label !== "Genus"
	) {
		throw new Error(
			"The collection metadata request did not contain the correct field metadata"
		)
	}
}
