package cmd

import (
	"time"

	"github.com/spf13/cobra"
	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/auth"
	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/logger"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

func init() {

	rootCmd.AddCommand(&cobra.Command{
		Use:   "invoices",
		Short: "uesio invoices",
		Run:   invoices,
	})

}

func invoices(cmd *cobra.Command, args []string) {

	logger.Log("Running uesio worker", logger.INFO)

	err := InvoicingJob()
	if err != nil {
		logger.Log("Invoicing Job failed reason: "+err.Error(), logger.ERROR)
	}

}

func InvoicingJob() error {

	logger.Log("Invoicing Job Running", logger.INFO)

	session, err := auth.GetStudioSystemSession(nil)
	if err != nil {
		return err
	}

	var apps meta.AppCollection
	err = datasource.PlatformLoad(&apps, nil, session)
	if err != nil {
		return err
	}

	for _, app := range apps {
		err := CreateInvoice(app, nil, session)
		if err != nil {
			return err
		}
	}

	return nil

}

func CreateInvoice(app *meta.App, connection adapt.Connection, session *sess.Session) error {

	invoiceLineItems := meta.InvoiceLineItemCollection{}

	//SAVE the invoce (we need the ID)
	invoice := &meta.Invoice{
		App:    app,
		Date:   time.Now().Format("2006-01-02"),
		Status: "NOTPAID",
	}

	err := datasource.PlatformSaveOne(invoice, nil, connection, session)
	if err != nil {
		return err
	}

	//GET all active licenses
	var licenses meta.LicenseCollection
	err = datasource.PlatformLoad(
		&licenses,
		&datasource.PlatformLoadOptions{
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
		session,
	)
	if err != nil {
		return err
	}

	//get all licensesIds as string & prepare invoice lines
	licenseIDs := []string{}
	for _, license := range licenses {

		licenseIDs = append(licenseIDs, license.ID)

		invoiceLineItems = append(invoiceLineItems, &meta.InvoiceLineItem{
			Invoice:     invoice,
			Description: license.UniqueKey,
			Quantity:    1,
			Price:       license.MonthlyPrice,
			Total:       license.MonthlyPrice,
		})

		//this is just to avoid looping at the end
		invoice.Total = invoice.Total + license.MonthlyPrice

	}

	//get all pricing items
	var lpic meta.LicensePricingItemCollection
	err = datasource.PlatformLoad(
		&lpic,
		&datasource.PlatformLoadOptions{
			Conditions: []adapt.LoadRequestCondition{
				{
					Field:    "uesio/studio.license",
					Operator: "IN",
					Value:    licenseIDs,
				},
			},
		},
		session,
	)
	if err != nil {
		return err
	}

	//Usage
	metadatatypes := []string{"FILESOURCE", "DATASOURCE"}
	var usage meta.UsageCollection

	//last month range
	lastMonth := time.Now().AddDate(0, -1, 0)
	currentYear, currentMonth, _ := lastMonth.Date()
	currentLocation := lastMonth.Location()

	firstOfMonth := time.Date(currentYear, currentMonth, 1, 0, 0, 0, 0, currentLocation)
	lastOfMonth := firstOfMonth.AddDate(0, 1, -1)

	err = datasource.PlatformLoad(
		&usage,
		&datasource.PlatformLoadOptions{
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
				{
					Field:    "uesio/studio.day",
					Operator: "GTE",
					Value:    firstOfMonth.Format("2006-01-02"),
				},
				{
					Field:    "uesio/studio.day",
					Operator: "LTE",
					Value:    lastOfMonth.Format("2006-01-02"),
				},
			},
		},
		session,
	)
	if err != nil {
		return err
	}

	invoiceLineItemMap := make(map[string]*meta.InvoiceLineItem, lpic.Len())
	for _, lpi := range lpic {
		invoiceLineItemMap[lpi.ActionType] = &meta.InvoiceLineItem{
			Invoice:     invoice,
			Description: lpi.UniqueKey,
			Quantity:    0,
			Price:       lpi.Price,
			Total:       0,
		}
	}

	for _, usageitem := range usage {

		invoiceLineItem, ok := invoiceLineItemMap[usageitem.ActionType]
		if !ok {
			// This particular usage is free!
			continue
		}

		invoiceLineItem.Quantity = invoiceLineItem.Quantity + usageitem.Total

	}

	//calculate total & save
	for _, item := range invoiceLineItemMap {
		item.Total = item.Price * float64(item.Quantity)
		invoice.Total = invoice.Total + item.Total
		invoiceLineItems = append(invoiceLineItems, item)
	}

	err = datasource.PlatformSave(datasource.PlatformSaveRequest{
		Collection: &invoiceLineItems,
	}, connection, session)
	if err != nil {
		return err
	}

	return datasource.PlatformSaveOne(invoice, nil, connection, session)

}
