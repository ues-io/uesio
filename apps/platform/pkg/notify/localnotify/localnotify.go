package localnotify

import (
	"fmt"

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

func (c *Connection) Send(subject, body, target string) error {
	fmt.Println("NOTIFICATION")
	fmt.Println("TO: " + target)
	fmt.Println("SUBJECT: " + subject)
	fmt.Println("BODY: " + body)
	return nil
}
