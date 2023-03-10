package meta

import (
	"strconv"
)

type NotificationSourceCollection []*NotificationSource

var NOTIFICATIONSOURCE_COLLECTION_NAME = "uesio/studio.notificationsource"
var NOTIFICATIONSOURCE_FOLDER_NAME = "notificationsources"
var NOTIFICATIONSOURCE_FIELDS = StandardGetFields(&NotificationSource{})

func (nsc *NotificationSourceCollection) GetName() string {
	return NOTIFICATIONSOURCE_COLLECTION_NAME
}

func (nsc *NotificationSourceCollection) GetBundleFolderName() string {
	return NOTIFICATIONSOURCE_FOLDER_NAME
}

func (nsc *NotificationSourceCollection) GetFields() []string {
	return NOTIFICATIONSOURCE_FIELDS
}

func (nsc *NotificationSourceCollection) NewItem() Item {
	return &NotificationSource{}
}

func (nsc *NotificationSourceCollection) AddItem(item Item) error {
	*nsc = append(*nsc, item.(*NotificationSource))
	return nil
}

func (nsc *NotificationSourceCollection) GetItemFromPath(path, namespace string) BundleableItem {
	return NewBaseNotificationSource(namespace, StandardNameFromPath(path))
}

func (nsc *NotificationSourceCollection) FilterPath(path string, conditions BundleConditions, definitionOnly bool) bool {
	return StandardPathFilter(path)
}

func (nsc *NotificationSourceCollection) Loop(iter GroupIterator) error {
	for index, ns := range *nsc {
		err := iter(ns, strconv.Itoa(index))
		if err != nil {
			return err
		}
	}
	return nil
}

func (nsc *NotificationSourceCollection) Len() int {
	return len(*nsc)
}
