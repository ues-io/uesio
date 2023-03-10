package sendgrid

import (
	"errors"
	"fmt"

	"github.com/sendgrid/sendgrid-go"
	"github.com/sendgrid/sendgrid-go/helpers/mail"
	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/notify"
)

type NotificationAdapter struct {
}

func (a *NotificationAdapter) GetNotificationConnection(credentials *adapt.Credentials, ns *meta.NotificationSource) (notify.NotificationConnection, error) {
	return &Connection{
		credentials: credentials,
	}, nil
}

type Connection struct {
	credentials *adapt.Credentials
}

func (c *Connection) SendMessage(subject, body, from, to string) error {
	return c.SendEmail(subject, body, from, []string{to}, nil, nil)
}

func (c *Connection) SendEmail(subject, body, from string, to, cc, bcc []string) error {

	apikey, ok := (*c.credentials)["apikey"]
	if !ok {
		return errors.New("No API Key provided")
	}

	toUsers := []*mail.Email{}
	for _, toRecipient := range to {
		toUsers = append(toUsers, mail.NewEmail(toRecipient, toRecipient))
	}

	ccUsers := []*mail.Email{}
	for _, ccRecipient := range cc {
		ccUsers = append(ccUsers, mail.NewEmail(ccRecipient, ccRecipient))
	}

	bccUsers := []*mail.Email{}
	for _, bccRecipient := range bcc {
		bccUsers = append(bccUsers, mail.NewEmail(bccRecipient, bccRecipient))
	}

	message := mail.NewV3Mail()
	message.Subject = subject
	p := mail.NewPersonalization()
	p.AddTos(toUsers...)
	p.AddCCs(ccUsers...)
	p.AddBCCs(bccUsers...)
	message.AddPersonalizations(p)
	message.AddContent(mail.NewContent("text/plain", body))
	message.SetFrom(mail.NewEmail(from, from))
	client := sendgrid.NewSendClient(apikey)
	response, err := client.Send(message)
	if err != nil {
		fmt.Println(response.StatusCode)
		fmt.Println(response.Body)
		fmt.Println(response.Headers)
		return err
	}

	return nil
}
