package datasource

import (
	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/cache"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

func setLicenced(licensed map[string]bool, change *adapt.ChangeItem) error {
	licensedAppID, err := change.GetFieldAsString("uesio/studio.applicensed->uesio/core.id")
	if err != nil {
		return err
	}
	if !licensed[licensedAppID] {
		licensed[licensedAppID] = true
	}
	return nil
}

func runLicenseAfterSaveBot(request *adapt.SaveOp, connection adapt.Connection, session *sess.Session) error {

	LicensePricingItemDeps := adapt.Collection{}
	visited := map[string]bool{}
	licensed := map[string]bool{}

	err := request.LoopUpdates(func(change *adapt.ChangeItem) error {
		return setLicenced(licensed, change)
	})
	if err != nil {
		return err
	}

	err = request.LoopDeletes(func(change *adapt.ChangeItem) error {
		return setLicenced(licensed, change)
	})
	if err != nil {
		return err
	}

	err = request.LoopInserts(func(change *adapt.ChangeItem) error {

		err := setLicenced(licensed, change)
		if err != nil {
			return err
		}

		licenseID := change.IDValue

		appID, err := change.GetFieldAsString("uesio/studio.app->uesio/core.id")
		if err != nil {
			return err
		}

		//This is for the seed to avoid duplicates
		if visited[appID] {
			return nil
		}
		visited[appID] = true

		var lptc meta.LicensePricingTemplateCollection
		PlatformLoad(
			&lptc,
			&PlatformLoadOptions{
				Connection: connection,
				Conditions: []adapt.LoadRequestCondition{
					{
						Field: "uesio/studio.app",
						Value: appID,
					},
				},
			},
			session,
		)

		lptc.Loop(func(item meta.Item, _ string) error {

			metadatatype, _ := item.GetField("uesio/studio.metadatatype")
			actiontype, _ := item.GetField("uesio/studio.actiontype")
			metadataname, _ := item.GetField("uesio/studio.metadataname")
			price, _ := item.GetField("uesio/studio.price")

			LicensePricingItemDeps = append(LicensePricingItemDeps, &adapt.Item{
				"uesio/studio.app": map[string]interface{}{
					adapt.ID_FIELD: appID,
				},
				"uesio/studio.license": map[string]interface{}{
					adapt.ID_FIELD: licenseID,
				},
				"uesio/studio.metadatatype": metadatatype,
				"uesio/studio.actiontype":   actiontype,
				"uesio/studio.metadataname": metadataname,
				"uesio/studio.price":        price,
			})

			return nil
		})

		return nil

	})

	if err != nil {
		return err
	}

	index := 0
	ids := make([]string, len(licensed))
	for k := range licensed {
		ids[index] = k
		index++
	}
	// Bust the cache for all our visited namespaces
	// But first find the namespaces
	var apps meta.AppCollection
	PlatformLoad(
		&apps,
		&PlatformLoadOptions{
			Connection: connection,
			Conditions: []adapt.LoadRequestCondition{
				{
					Field:    adapt.ID_FIELD,
					Operator: "IN",
					Value:    ids,
				},
			},
		},
		session,
	)

	keysToBust := []string{}
	for _, app := range apps {
		keysToBust = append(keysToBust, cache.GetLicenseKey(app.UniqueKey))
	}

	err = cache.DeleteKeys(keysToBust)
	if err != nil {
		return err
	}

	if LicensePricingItemDeps.Len() == 0 {
		return nil
	}

	return SaveWithOptions([]SaveRequest{
		{
			Collection: "uesio/studio.licensepricingitem",
			Wire:       "LicensePricingTemplatedWire",
			Changes:    &LicensePricingItemDeps,
			Options: &adapt.SaveOptions{
				Upsert: true,
			},
		},
	}, session, GetConnectionSaveOptions(connection))

}
