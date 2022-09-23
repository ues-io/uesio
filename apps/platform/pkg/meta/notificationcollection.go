package meta

import (
	"strconv"

	"github.com/thecloudmasters/uesio/pkg/meta/loadable"
)

type NotificationCollection []*Notification

func (nc *NotificationCollection) GetName() string {
	return "uesio/studio.datasource"
}

func (nc *NotificationCollection) GetBundleFolderName() string {
	return "datasources"
}

func (nc *NotificationCollection) GetFields() []string {
	return StandardGetFields(&DataSource{})
}

func (nc *NotificationCollection) NewItem() loadable.Item {
	n := &Notification{}
	*nc = append(*nc, n)
	return n
}

func (nc *NotificationCollection) NewBundleableItemWithKey(key string) (BundleableItem, error) {
	n, err := NewNotification(key)
	if err != nil {
		return nil, err
	}
	*nc = append(*nc, n)
	return n, nil
}

func (nc *NotificationCollection) GetKeyFromPath(path string, namespace string, conditions BundleConditions) (string, error) {
	return StandardKeyFromPath(path, namespace, conditions)
}

func (nc *NotificationCollection) GetItem(index int) loadable.Item {
	return (*nc)[index]
}

func (nc *NotificationCollection) Loop(iter loadable.GroupIterator) error {
	for index := range *nc {
		err := iter(nc.GetItem(index), strconv.Itoa(index))
		if err != nil {
			return err
		}
	}
	return nil
}

func (nc *NotificationCollection) Len() int {
	return len(*nc)
}

func (nc *NotificationCollection) GetItems() interface{} {
	return *nc
}
