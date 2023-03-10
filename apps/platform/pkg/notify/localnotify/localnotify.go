package localnotify

import (
	"fmt"
	"os/exec"
	"runtime"
	"strings"

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
	fmt.Println("NOTIFICATION")
	fmt.Println("TO: " + to)
	fmt.Println("FROM: " + from)
	fmt.Println("SUBJECT: " + subject)
	fmt.Println("BODY: " + body)
	// If we're running on a mac, just for fun add a desktop notification
	if runtime.GOOS != "darwin" {
		return nil
	}
	title := strings.Replace(subject, `"`, `\"`, -1)
	text := strings.Replace(body, `"`, `\"`, -1)
	notification := fmt.Sprintf("display notification \"%s\" with title \"%s\" subtitle \"%s\"", text, title, to)
	return exec.Command("osascript", "-e", notification).Run()
}

func (c *Connection) SendEmail(subject, body, from string, to, cc, bcc []string) error {
	for _, recipient := range to {
		err := c.SendMessage(subject, body, from, recipient)
		if err != nil {
			return err
		}
	}
	for _, recipient := range cc {
		err := c.SendMessage(subject, body, from, recipient)
		if err != nil {
			return err
		}
	}
	for _, recipient := range bcc {
		err := c.SendMessage(subject, body, from, recipient)
		if err != nil {
			return err
		}
	}
	return nil
}
