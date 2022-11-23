package datasource

import (
	"errors"

	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

func runCreateInvoiceListenerBot(params map[string]interface{}, connection adapt.Connection, session *sess.Session) error {

	//INPUTS???
	//DATE range
	//commit yes/no

	appID := session.GetContextAppName()

	if appID == "" {
		return errors.New("Error creating a new invoice, missing app")
	}

	//LOAD the APP we need
	var app meta.App
	err := PlatformLoadOne(
		&app,
		&PlatformLoadOptions{
			Connection: connection,
			Fields: []adapt.LoadRequestField{
				{
					ID: adapt.ID_FIELD,
				},
			},
			Conditions: []adapt.LoadRequestCondition{
				{
					Field: adapt.UNIQUE_KEY_FIELD,
					Value: appID,
				},
			},
		},
		session.RemoveWorkspaceContext(),
	)
	if err != nil {
		return err
	}

	//GET all active licenses
	var licenses meta.LicenseCollection
	err = PlatformLoad(
		&licenses,
		&PlatformLoadOptions{
			Connection: connection,
			Conditions: []adapt.LoadRequestCondition{
				{
					Field: "uesio/studio.applicensed",
					Value: app.ID,
				},
				{
					Field: "uesio/studio.active",
					Value: true,
				},
			},
		},
		session.RemoveWorkspaceContext(),
	)
	if err != nil {
		return err
	}

	//get all licensesIds as string
	licensesIds := []string{}
	licenses.Loop(func(item meta.Item, _ string) error {
		uniquekey, err := item.GetField(adapt.ID_FIELD)
		if err != nil {
			return err
		}

		uniquekeyAsString, ok := uniquekey.(string)
		if !ok {
			return errors.New("id must be a string")
		}

		licensesIds = append(licensesIds, uniquekeyAsString)

		return nil
	})

	//get all pricing items
	var lpic meta.LicensePricingItemCollection
	err = PlatformLoad(
		&lpic,
		&PlatformLoadOptions{
			Conditions: []adapt.LoadRequestCondition{
				{
					Field:    "uesio/studio.license",
					Operator: "IN",
					Value:    licensesIds,
				},
			},
		},
		session.RemoveWorkspaceContext(),
	)
	if err != nil {
		return err
	}

	//get usage for this app in a date range?
	metadatatypes := []string{"FILESOURCE", "DATASOURCE"}
	var usage meta.UsageCollection
	err = PlatformLoad(
		&usage,
		&PlatformLoadOptions{
			Conditions: []adapt.LoadRequestCondition{
				{
					Field: "uesio/studio.app",
					Value: app.ID,
				},
				{
					Field:    "uesio/studio.metadatatype",
					Operator: "IN",
					Value:    metadatatypes,
				},
			},
		},
		session.RemoveWorkspaceContext(),
	)
	if err != nil {
		return err
	}

	type record struct {
		total int
		price int
	}

	var mymap map[string]record

	//merge lpic and usage
	lpic.Loop(func(item meta.Item, _ string) error {
		actiontype, err := item.GetField("uesio/studio.actiontype")
		if err != nil {
			return err
		}

		actiontypeAsString, ok := actiontype.(string)
		if !ok {
			return errors.New("actiontype must be a string")
		}

		mymap[actiontypeAsString] = record{total: 2, price: 2}

		//UPLOAD_BYTES

		//licensesIds = append(licensesIds, uniquekeyAsString)

		return nil
	})

	//query all the sites of the app

	//use maps

	// return CreateBundle(appID, workspace.Name, bundle, wsbs, session)

	return nil
}
