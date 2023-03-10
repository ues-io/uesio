package ses

import (
	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/notify"
)

type NotificationAdapter struct {
}

func (a *NotificationAdapter) GetNotificationConnection(credentials *adapt.Credentials) (notify.NotificationConnection, error) {
	return &Connection{
		credentials: credentials,
	}, nil
}

type Connection struct {
	credentials *adapt.Credentials
}

func (c *Connection) SendMessage(subject, body, from, to string) error {
	return nil
}

func (c *Connection) SendEmail(subject, body, from string, to, cc, bcc []string) error {
	return nil
}
