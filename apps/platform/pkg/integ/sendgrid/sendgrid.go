package sendgrid

import (
	"errors"
	"fmt"

	"github.com/sendgrid/sendgrid-go"
	"github.com/sendgrid/sendgrid-go/helpers/mail"

	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
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

type SendGridIntegration struct {
}

func (sgi *SendGridIntegration) GetIntegrationConnection(integration *meta.Integration, session *sess.Session, credentials *adapt.Credentials) (adapt.IntegrationConnection, error) {
	return &SendGridIntegrationConnection{
		session:     session,
		integration: integration,
		credentials: credentials,
	}, nil
}

type SendGridIntegrationConnection struct {
	session     *sess.Session
	integration *meta.Integration
	credentials *adapt.Credentials
}

func (sgic *SendGridIntegrationConnection) GetCredentials() *adapt.Credentials {
	return sgic.credentials
}

func (sgic *SendGridIntegrationConnection) GetIntegration() *meta.Integration {
	return sgic.integration
}

func (sgic *SendGridIntegrationConnection) RunAction(actionName string, requestOptions interface{}) (interface{}, error) {

	switch actionName {
	case "sendEmail":
		return nil, sgic.SendEmail(requestOptions)
	}

	return nil, errors.New("Invalid Action Name for SendGrid integration")

}

func (sgic *SendGridIntegrationConnection) SendEmail(requestOptions interface{}) error {

	options := &SendEmailOptions{}
	err := datasource.HydrateOptions(requestOptions, options)
	if err != nil {
		return err
	}

	apikey, ok := (*sgic.credentials)["apikey"]
	if !ok || apikey == "" {
		return errors.New("No API Key provided")
	}

	toUsers := []*mail.Email{}
	for _, toRecipient := range options.To {
		toUsers = append(toUsers, mail.NewEmail(toRecipient, toRecipient))
	}

	ccUsers := []*mail.Email{}
	for _, ccRecipient := range options.CC {
		ccUsers = append(ccUsers, mail.NewEmail(ccRecipient, ccRecipient))
	}

	bccUsers := []*mail.Email{}
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
	client := sendgrid.NewSendClient(apikey)
	response, err := client.Send(message)
	if err != nil {
		return err
	}
	if response.StatusCode != 202 {
		return fmt.Errorf("%v %s", response.StatusCode, response.Body)
	}

	return nil
}
