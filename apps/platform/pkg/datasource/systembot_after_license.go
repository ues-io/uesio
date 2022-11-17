package datasource

import (
	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

func runLicenseAfterSaveBot(request *adapt.SaveOp, connection adapt.Connection, session *sess.Session) error {

	LicensePricingItemDeps := adapt.Collection{}
	visited := map[string]bool{}
	err := request.LoopInserts(func(change *adapt.ChangeItem) error {

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

	err = SaveWithOptions([]SaveRequest{
		{
			Collection: "uesio/studio.licensepricingitem",
			Wire:       "LicensePricingTemplatedWire",
			Changes:    &LicensePricingItemDeps,
			Options: &adapt.SaveOptions{
				Upsert: true,
			},
		},
	}, session, GetConnectionSaveOptions(connection))

	return err

}
