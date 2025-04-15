package systemdialect

import (
	"github.com/thecloudmasters/uesio/pkg/constant/commonfields"
	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/goutils"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
	"github.com/thecloudmasters/uesio/pkg/types/wire"
)

func setLicenced(licensed map[string]bool, change *wire.ChangeItem) error {
	licensedAppID, err := change.GetFieldAsString("uesio/studio.applicensed->uesio/core.id")
	if err != nil {
		return err
	}
	if !licensed[licensedAppID] {
		licensed[licensedAppID] = true
	}
	return nil
}

func runLicenseAfterSaveBot(request *wire.SaveOp, connection wire.Connection, session *sess.Session) error {

	licensePricingItemDeps := wire.Collection{}
	visited := map[string]bool{}
	licensed := map[string]bool{}

	err := request.LoopUpdates(func(change *wire.ChangeItem) error {
		return setLicenced(licensed, change)
	})
	if err != nil {
		return err
	}

	err = request.LoopDeletes(func(change *wire.ChangeItem) error {
		return setLicenced(licensed, change)
	})
	if err != nil {
		return err
	}

	err = request.LoopInserts(func(change *wire.ChangeItem) error {

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
		err = datasource.PlatformLoad(
			&lptc,
			&datasource.PlatformLoadOptions{
				Connection: connection,
				Conditions: []wire.LoadRequestCondition{
					{
						Field: "uesio/studio.app",
						Value: appID,
					},
				},
			},
			session,
		)
		if err != nil {
			return err
		}

		for _, ptc := range lptc {
			licensePricingItemDeps = append(licensePricingItemDeps, &wire.Item{
				"uesio/studio.app": map[string]interface{}{
					commonfields.Id: appID,
				},
				"uesio/studio.license": map[string]interface{}{
					commonfields.Id: licenseID,
				},
				"uesio/studio.metadatatype": ptc.MetadataType,
				"uesio/studio.actiontype":   ptc.ActionType,
				"uesio/studio.metadataname": ptc.MetadataName,
				"uesio/studio.price":        ptc.Price,
			})
		}

		return nil

	})

	if err != nil {
		return err
	}
	ids := goutils.MapKeys(licensed)
	// Bust the cache for all our visited namespaces
	// But first find the namespaces
	var apps meta.AppCollection
	err = datasource.PlatformLoad(
		&apps,
		&datasource.PlatformLoadOptions{
			Connection: connection,
			Conditions: []wire.LoadRequestCondition{
				{
					Field:    commonfields.Id,
					Operator: "IN",
					Value:    ids,
				},
			},
		},
		session,
	)
	if err != nil {
		return err
	}

	appUniqueKeys := make([]string, len(apps))
	for i, app := range apps {
		appUniqueKeys[i] = app.UniqueKey
	}
	if err = datasource.InvalidateLicenseCaches(appUniqueKeys); err != nil {
		return err
	}

	if licensePricingItemDeps.Len() == 0 {
		return nil
	}

	return datasource.SaveWithOptions([]datasource.SaveRequest{
		{
			Collection: "uesio/studio.licensepricingitem",
			Wire:       "LicensePricingTemplatedWire",
			Changes:    &licensePricingItemDeps,
			Options: &wire.SaveOptions{
				Upsert: true,
			},
		},
	}, session, datasource.NewSaveOptions(connection, nil))

}
