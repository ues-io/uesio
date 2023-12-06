package sendgrid

import (
	"errors"
	"fmt"
	"strings"

	"github.com/sendgrid/sendgrid-go"
	"github.com/sendgrid/sendgrid-go/helpers/mail"

	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/types/wire"
)

type SendEmailOptions struct {
	To                  []string               `json:"to"`
	CC                  []string               `json:"cc"`
	BCC                 []string               `json:"bcc"`
	Subject             string                 `json:"subject"`
	PlainBody           string                 `json:"plainBody"`
	ContentType         string                 `json:"contentType"`
	From                string                 `json:"from"`
	TemplateId          string                 `json:"templateId"`
	DynamicTemplateData map[string]interface{} `json:"dynamicTemplateData"`
}

type connection struct {
	client      *sendgrid.Client
	integration *wire.IntegrationConnection
}

func newSendGridConnection(ic *wire.IntegrationConnection) (*connection, error) {
	apikey, err := ic.GetCredentials().GetRequiredEntry("apikey")
	if err != nil || apikey == "" {
		return nil, errors.New("SendGrid API Key not provided")
	}
	return &connection{
		client:      sendgrid.NewSendClient(apikey),
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
		return nil, sgic.sendEmail(params)
	}

	return nil, errors.New("invalid action name for SendGrid integration")

}

func (sgic *connection) sendEmail(requestOptions map[string]interface{}) error {

	options := &SendEmailOptions{}
	err := datasource.HydrateOptions(requestOptions, options)
	if err != nil {
		return err
	}

	var toUsers []*mail.Email
	for _, toRecipient := range options.To {
		toUsers = append(toUsers, mail.NewEmail(toRecipient, toRecipient))
	}

	var ccUsers []*mail.Email
	for _, ccRecipient := range options.CC {
		ccUsers = append(ccUsers, mail.NewEmail(ccRecipient, ccRecipient))
	}

	var bccUsers []*mail.Email
	for _, bccRecipient := range options.BCC {
		bccUsers = append(bccUsers, mail.NewEmail(bccRecipient, bccRecipient))
	}

	message := mail.NewV3Mail()
	message.Subject = options.Subject
	p := mail.NewPersonalization()
	p.AddTos(toUsers...)
	p.AddCCs(ccUsers...)
	p.AddBCCs(bccUsers...)

	if options.TemplateId != "" {
		message.SetTemplateID(options.TemplateId)
		p.DynamicTemplateData = options.DynamicTemplateData
	}

	message.AddPersonalizations(p)
	if options.PlainBody != "" {
		contentType := "text/plain"
		if options.ContentType != "" {
			contentType = options.ContentType
		}
		message.AddContent(mail.NewContent(contentType, options.PlainBody))
	}
	message.SetFrom(mail.NewEmail(options.From, options.From))
	response, err := sgic.client.Send(message)
	if err != nil {
		return err
	}
	if response.StatusCode != 202 {
		return fmt.Errorf("%v %s", response.StatusCode, response.Body)
	}

	return nil
}
