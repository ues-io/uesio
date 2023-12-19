package meta

import (
	"errors"
	"fmt"
	"os"
	"strconv"
	"strings"
)

type IntegrationActionCollection []*IntegrationAction

var INTEGRATION_ACTION_COLLECTION_NAME = "uesio/studio.integrationaction"
var INTEGRATION_ACTION_FOLDER_NAME = "integrationactions"
var INTEGRATION_ACTION_FIELDS = StandardGetFields(&IntegrationAction{})

func (iac *IntegrationActionCollection) GetName() string {
	return INTEGRATION_ACTION_COLLECTION_NAME
}

func (iac *IntegrationActionCollection) GetBundleFolderName() string {
	return INTEGRATION_ACTION_FOLDER_NAME
}

func (iac *IntegrationActionCollection) GetFields() []string {
	return INTEGRATION_ACTION_FIELDS
}

func (iac *IntegrationActionCollection) NewItem() Item {
	return &IntegrationAction{}
}

func (iac *IntegrationActionCollection) AddItem(item Item) error {
	*iac = append(*iac, item.(*IntegrationAction))
	return nil
}

func (iac *IntegrationActionCollection) GetItemFromPath(path, namespace string) BundleableItem {
	parts := strings.Split(path, string(os.PathSeparator))
	partLength := len(parts)
	if partLength != 4 {
		return nil
	}
	integrationName := fmt.Sprintf("%s/%s.%s", parts[0], parts[1], parts[2])
	name := strings.TrimSuffix(parts[3], ".yaml")
	return NewBaseIntegrationAction(integrationName, namespace, name)
}

func (iac *IntegrationActionCollection) GetItemFromKey(key string) (BundleableItem, error) {
	keyArray := strings.Split(key, ":")
	if (len(keyArray)) != 2 {
		return nil, errors.New("invalid Integration Action Key")
	}
	return NewIntegrationAction(keyArray[0], keyArray[1])
}

func (iac *IntegrationActionCollection) FilterPath(path string, conditions BundleConditions, definitionOnly bool) bool {
	return GroupedPathFilter(path, "uesio/studio.integrationtype", conditions)
}

func (iac *IntegrationActionCollection) Loop(iter GroupIterator) error {
	for index, as := range *iac {
		err := iter(as, strconv.Itoa(index))
		if err != nil {
			return err
		}
	}
	return nil
}

func (iac *IntegrationActionCollection) Len() int {
	return len(*iac)
}
