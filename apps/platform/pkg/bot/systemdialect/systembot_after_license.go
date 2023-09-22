package systemdialect

import (
	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/goutils"
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

	licensePricingItemDeps := adapt.Collection{}
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
		err = datasource.PlatformLoad(
			&lptc,
			&datasource.PlatformLoadOptions{
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
		if err != nil {
			return err
		}

		for _, ptc := range lptc {
			licensePricingItemDeps = append(licensePricingItemDeps, &adapt.Item{
				"uesio/studio.app": map[string]interface{}{
					adapt.ID_FIELD: appID,
				},
				"uesio/studio.license": map[string]interface{}{
					adapt.ID_FIELD: licenseID,
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
	if err != nil {
		return err
	}

	keysToBust := make([]string, len(apps), len(apps))
	for i, app := range apps {
		keysToBust[i] = app.UniqueKey
	}
	if err = datasource.InvalidateLicenseCaches(keysToBust); err != nil {
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
			Options: &adapt.SaveOptions{
				Upsert: true,
			},
		},
	}, session, datasource.GetConnectionSaveOptions(connection))

}
