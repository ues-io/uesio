package notify

import (
	"errors"

	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/bundle"
	"github.com/thecloudmasters/uesio/pkg/configstore"
	"github.com/thecloudmasters/uesio/pkg/creds"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

type NotificationAdapter interface {
	GetNotificationConnection(*adapt.Credentials) (NotificationConnection, error)
}

type NotificationConnection interface {
	SendMessage(subject, body, from, to string) error
	SendEmail(subject, body, from string, to, cc, bcc []string) error
}

var adapterMap = map[string]NotificationAdapter{}

func GetNotificationAdapter(adapterType string, session *sess.Session) (NotificationAdapter, error) {
	mergedType, err := configstore.Merge(adapterType, session)
	if err != nil {
		return nil, err
	}
	adapter, ok := adapterMap[mergedType]
	if !ok {
		return nil, errors.New("No adapter found of this type: " + adapterType)
	}
	return adapter, nil
}

func RegisterNotificationAdapter(name string, adapter NotificationAdapter) {
	adapterMap[name] = adapter
}

func GetNotificationConnection(session *sess.Session) (NotificationConnection, error) {
	// For now, we hardcode the notification source to be the built-in one.
	ns, err := meta.NewNotificationSource("uesio/core.platform")
	if err != nil {
		return nil, err
	}
	err = bundle.Load(ns, session, nil)
	if err != nil {
		return nil, err
	}

	notificationAdapter, err := GetNotificationAdapter(ns.Type, session)
	if err != nil {
		return nil, err
	}
	credentials, err := creds.GetCredentials(ns.Credentials, session)
	if err != nil {
		return nil, err
	}

	return notificationAdapter.GetNotificationConnection(credentials)
}
