package datasource

import (
	"errors"
	"time"

	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

func runCreateInvoiceListenerBot(params map[string]interface{}, connection adapt.Connection, session *sess.Session) error {

	//INPUTS???
	//DATE range
	//commit yes/no
	//we can start a transaction

	invoiceLinesDeps := adapt.Collection{}

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

	//SAVE the invoce (we need the ID)

	invoice := meta.Invoice{
		App:  &app,
		Date: time.Now().Format("2006-01-02"),
	}

	err = PlatformSaveOne(&invoice, nil, connection, session)
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
		id, err := item.GetField(adapt.ID_FIELD)
		if err != nil {
			return err
		}

		idAsString, ok := id.(string)
		if !ok {
			return errors.New("id must be a string")
		}

		uniqueKey, err := item.GetField(adapt.UNIQUE_KEY_FIELD)
		if err != nil {
			return err
		}

		uniqueKeyAsString, ok := uniqueKey.(string)
		if !ok {
			return errors.New("unique key must be a string")
		}

		licensesIds = append(licensesIds, idAsString)

		//one line per license where monthlyprice > 0
		monthlyprice, err := item.GetField("uesio/studio.monthlyprice")
		if err != nil {
			return err
		}

		monthlypricefloat, ok := monthlyprice.(float64)
		if !ok {
			return errors.New("monthlyprice must be a number")
		}

		invoiceLinesDeps = append(invoiceLinesDeps, &adapt.Item{
			"uesio/studio.invoice": map[string]interface{}{
				adapt.ID_FIELD: invoice.ID,
			},
			// "uesio/studio.amount":      monthlypricefloat,
			"uesio/studio.description": uniqueKeyAsString,
			"uesio/studio.quantity":    1,
			"uesio/studio.price":       monthlypricefloat,
		})

		//this is just to avoid looping at the end
		invoice.Total = invoice.Total + monthlypricefloat

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
		total       int64
		price       float64
		description string
	}

	accumulate := make(map[string]record, lpic.Len())

	//merge lpic and usage
	lpic.Loop(func(item meta.Item, _ string) error {
		pricingActiontype, err := item.GetField("uesio/studio.actiontype")
		if err != nil {
			return err
		}

		pricingActiontypeStr, ok := pricingActiontype.(string)
		if !ok {
			return errors.New("actiontype must be a string")
		}

		if _, ok := accumulate[pricingActiontypeStr]; !ok {
			//NEW record & get the price for that record
			price, err := item.GetField("uesio/studio.price")
			if err != nil {
				return err
			}

			pricefloat64, ok := price.(float64)
			if !ok {
				return errors.New("price must be a number")
			}

			accumulate[pricingActiontypeStr] = record{description: pricingActiontypeStr, price: pricefloat64, total: 0}
		}

		return nil
	})

	usage.Loop(func(item meta.Item, _ string) error {
		UsageActiontype, err := item.GetField("uesio/studio.actiontype")
		if err != nil {
			return err
		}

		UsageActiontypeStr, ok := UsageActiontype.(string)
		if !ok {
			return errors.New("actiontype must be a string")
		}

		if lrecord, ok := accumulate[UsageActiontypeStr]; ok {

			total, err := item.GetField("uesio/studio.total")
			if err != nil {
				return err
			}

			totalint64, ok := total.(int64)
			if !ok {
				return errors.New("total must be a number")
			}

			lrecord.total = lrecord.total + totalint64
			accumulate[UsageActiontypeStr] = lrecord

		}

		return nil
	})

	//calculate total & save
	for _, record := range accumulate {
		lineTotal := record.price * float64(record.total)
		invoice.Total = invoice.Total + lineTotal

		invoiceLinesDeps = append(invoiceLinesDeps, &adapt.Item{
			"uesio/studio.invoice": map[string]interface{}{
				adapt.ID_FIELD: invoice.ID,
			},
			//"uesio/studio.amount":      lineTotal,
			"uesio/studio.description": record.description,
			"uesio/studio.quantity":    record.total,
			"uesio/studio.price":       record.price,
		})

	}

	//SAve the lines & the invoice
	err = SaveWithOptions([]SaveRequest{
		{
			Collection: "uesio/studio.invoiceline",
			Wire:       "invoicelineWire",
			Changes:    &invoiceLinesDeps,
			Options: &adapt.SaveOptions{
				Upsert: true,
			},
		},
	}, session, GetConnectionSaveOptions(connection))
	if err != nil {
		return err
	}

	err = PlatformSaveOne(&invoice, nil, connection, session)
	if err != nil {
		return err
	}

	//

	return nil
}
