package invoices

import (
	"context"
	"errors"
	"log/slog"
	"strings"
	"time"

	"github.com/thecloudmasters/uesio/pkg/auth"
	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
	"github.com/thecloudmasters/uesio/pkg/templating"
	"github.com/thecloudmasters/uesio/pkg/translate"
	"github.com/thecloudmasters/uesio/pkg/types/wire"
)

func InvoicingJobNoContext() error {
	return InvoicingJob(context.Background())
}

func InvoicingJob(ctx context.Context) error {

	slog.Info("Starting Invoicing job...")

	session, err := auth.GetStudioSystemSession(ctx, nil)
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

	slog.Info("Invoicing job successfully completed.")

	return nil

}

func parseLicenseKey(key string) (string, string, error) {
	keyArray := strings.Split(key, ":")
	if len(keyArray) != 2 {
		return "", "", errors.New("Invalid Key: " + key)
	}
	return keyArray[0], keyArray[1], nil
}

func parseLipsKey(key string) (string, string, string, error) {
	keyArray := strings.Split(key, ":")
	if len(keyArray) != 5 {
		return "", "", "", errors.New("Invalid Key: " + key)
	}
	return keyArray[2], keyArray[3], keyArray[4], nil
}

func getLicenseDescr(uniquekey string, labels map[string]string) (string, error) {

	label := labels["uesio/studio.licensedescription"]
	app, _, err := parseLicenseKey(uniquekey)

	if err != nil {
		return "", err
	}

	templateMergeValues := map[string]interface{}{
		"app": app,
	}

	template, err := templating.NewTemplateWithValidKeysOnly(label)
	if err != nil {
		return "", err
	}

	result, err := templating.Execute(template, templateMergeValues)
	if err != nil {
		return "", err
	}

	return result, nil
}

func getLipsDescr(uniquekey string, labels map[string]string) (string, error) {

	label := labels["uesio/studio.licensepricingitemdescription"]
	app, metadatatype, actiontype, err := parseLipsKey(uniquekey)

	if err != nil {
		return "", err
	}

	templateMergeValues := map[string]interface{}{
		"app":          app,
		"metadatatype": metadatatype,
		"actiontype":   actiontype,
	}

	template, err := templating.NewTemplateWithValidKeysOnly(label)
	if err != nil {
		return "", err
	}

	result, err := templating.Execute(template, templateMergeValues)
	if err != nil {
		return "", err
	}

	return result, nil
}

func CreateInvoice(app *meta.App, connection wire.Connection, session *sess.Session) error {

	//This creates a copy of the session
	userSession := session.RemoveWorkspaceContext()
	labels, err := translate.GetTranslatedLabels(userSession)
	if err != nil {
		return err
	}

	invoiceLineItems := meta.InvoiceLineItemCollection{}

	//SAVE the invoce (we need the ID)
	invoice := &meta.Invoice{
		App:  app,
		Date: time.Now().Format("2006-01-02"),
	}

	err = datasource.PlatformSaveOne(invoice, nil, connection, session)
	if err != nil {
		return err
	}

	//GET all active licenses
	var licenses meta.LicenseCollection
	err = datasource.PlatformLoad(
		&licenses,
		&datasource.PlatformLoadOptions{
			Connection: connection,
			Conditions: []wire.LoadRequestCondition{
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

		if license.MonthlyPrice > 0 {

			descr, err := getLicenseDescr(license.UniqueKey, labels)
			if err != nil {
				return err
			}

			invoiceLineItems = append(invoiceLineItems, &meta.InvoiceLineItem{
				Invoice:     invoice,
				Description: descr,
				Quantity:    1,
				Price:       license.MonthlyPrice,
				Total:       license.MonthlyPrice,
			})

			//this is just to avoid looping at the end
			invoice.Total = invoice.Total + license.MonthlyPrice
		}

	}

	//get all pricing items
	var lpic meta.LicensePricingItemCollection
	err = datasource.PlatformLoad(
		&lpic,
		&datasource.PlatformLoadOptions{
			Conditions: []wire.LoadRequestCondition{
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
			Conditions: []wire.LoadRequestCondition{
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

		descr, err := getLipsDescr(lpi.UniqueKey, labels)
		if err != nil {
			return err
		}

		invoiceLineItemMap[lpi.ActionType] = &meta.InvoiceLineItem{
			Invoice:     invoice,
			Description: descr,
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
		linePrice := item.Price * float64(item.Quantity)
		if linePrice > 0 {
			item.Total = linePrice
			invoice.Total = invoice.Total + item.Total
			invoiceLineItems = append(invoiceLineItems, item)
		}
	}

	err = datasource.PlatformSave(datasource.PlatformSaveRequest{
		Collection: &invoiceLineItems,
	}, connection, session)
	if err != nil {
		return err
	}

	return datasource.PlatformSaveOne(invoice, nil, connection, session)

}
