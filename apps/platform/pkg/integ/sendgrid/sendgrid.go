package sendgrid

import (
	"fmt"
	"log/slog"
	"strings"

	"github.com/sendgrid/rest"
	"github.com/sendgrid/sendgrid-go"
	"github.com/sendgrid/sendgrid-go/helpers/mail"

	"github.com/thecloudmasters/uesio/pkg/env"
	"github.com/thecloudmasters/uesio/pkg/goutils"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/types/exceptions"
	"github.com/thecloudmasters/uesio/pkg/types/wire"
)

type connection struct {
	client      EmailClient
	integration *wire.IntegrationConnection
}

type EmailClient interface {
	Send(email *mail.SGMailV3) (*rest.Response, error)
}

func newSendGridConnection(ic *wire.IntegrationConnection) (*connection, error) {
	apikey, err := ic.GetCredentials().GetRequiredEntry("apikey")
	var client EmailClient
	if err != nil || apikey == "" {
		// Since we use SendGrid for user signup / password resets / etc.,
		// in local development we want to allow for this to work without you having to set-up SendGrid,
		// so we will populate a mock API Key and just log the emails to the console
		if env.InDevMode() && ic.GetIntegration().Namespace == "uesio/core" && ic.GetIntegration().Name == "sendgrid" {
			slog.Warn("[SendGrid mock client] SendGrid API Key not configured, using mock implementation for local dev")
			client = &devClient{}
		} else {
			return nil, exceptions.NewUnauthorizedException("SendGrid API Key not provided")
		}
	} else {
		client = sendgrid.NewSendClient(apikey)
	}
	return &connection{
		client:      client,
		integration: ic,
	}, nil
}

// RunAction implements the system bot interface
func RunAction(bot *meta.Bot, ic *wire.IntegrationConnection, actionName string, params map[string]interface{}) (interface{}, error) {
	sgic, err := newSendGridConnection(ic)
	if err != nil {
		return nil, err
	}
	switch strings.ToLower(actionName) {
	case "sendemail":
		return sgic.sendEmail(params)
	}
	return nil, exceptions.NewBadRequestException("invalid action name for SendGrid integration")
}

func getEmailsList(addresses interface{}, names interface{}) []*mail.Email {

	addressesSlice, isAddressesSlice := goutils.StringSliceValue(addresses)
	namesSlice, isNamesSlice := goutils.StringSliceValue(names)

	// Try to parse the emails as slices
	if isAddressesSlice {
		// First, check if the slice lengths are the same
		haveMatchingNamesSlice := isNamesSlice && (len(addressesSlice) == len(namesSlice))
		var emails []*mail.Email
		for i := range addressesSlice {
			var name string
			address := addressesSlice[i]
			if haveMatchingNamesSlice {
				name = namesSlice[i]
			}
			if name == "" {
				name = address
			}
			emails = append(emails, &mail.Email{
				Name:    name,
				Address: address,
			})
		}
		return emails
	}
	return []*mail.Email{}
}

func createMessage(requestOptions map[string]interface{}) *mail.SGMailV3 {

	message := mail.NewV3Mail()
	p := mail.NewPersonalization()
	var fromAddress, fromName, plainBody, contentType, templateId string
	var dynamicTemplateData map[string]interface{}
	var toAddresses, toNames, ccAddresses, ccNames, bccAddresses, bccNames interface{}

	for k, v := range requestOptions {
		switch k {
		case "to":
			toAddresses = v
		case "toNames":
			toNames = v
		case "cc":
			ccAddresses = v
		case "ccNames":
			ccNames = v
		case "bcc":
			bccAddresses = v
		case "bccNames":
			bccNames = v
		case "subject":
			message.Subject = goutils.StringValue(v)
		case "plainBody", "plainbody":
			plainBody = goutils.StringValue(v)
		case "contentType", "contenttype":
			contentType = goutils.StringValue(v)
		case "from":
			fromAddress = goutils.StringValue(v)
		case "fromName":
			fromName = goutils.StringValue(v)
		case "templateId", "templateid":
			templateId = goutils.StringValue(v)
		case "dynamicTemplateData", "dynamictemplatedata":
			if mapVal, isMap := v.(map[string]interface{}); isMap {
				dynamicTemplateData = mapVal
			}
		}
	}
	p.AddTos(getEmailsList(toAddresses, toNames)...)
	p.AddCCs(getEmailsList(ccAddresses, ccNames)...)
	p.AddBCCs(getEmailsList(bccAddresses, bccNames)...)

	// Default FromName to From address
	if fromName == "" && fromAddress != "" {
		fromName = fromAddress
	}
	if templateId != "" {
		message.SetTemplateID(templateId)
		p.DynamicTemplateData = dynamicTemplateData
	}
	if plainBody != "" {
		if contentType == "" {
			contentType = "text/plain"
		}
		message.AddContent(mail.NewContent(contentType, plainBody))
	}
	message.AddPersonalizations(p)
	message.SetFrom(mail.NewEmail(fromName, fromAddress))

	return message
}

func (sgic *connection) sendEmail(requestOptions map[string]interface{}) (map[string]interface{}, error) {
	message := createMessage(requestOptions)
	response, err := sgic.client.Send(message)
	if err != nil {
		return nil, err
	}
	if response.StatusCode != 202 {
		return nil, fmt.Errorf("%v %s", response.StatusCode, response.Body)
	}
	return map[string]interface{}{
		"messageId": response.Headers["X-Message-Id"],
	}, nil
}
