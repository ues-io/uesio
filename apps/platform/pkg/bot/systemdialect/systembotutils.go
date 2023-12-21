package systemdialect

import (
	"errors"

	"github.com/thecloudmasters/uesio/pkg/bundle"
	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
	"github.com/thecloudmasters/uesio/pkg/types/exceptions"
	"github.com/thecloudmasters/uesio/pkg/types/wire"
)

type MetadataDependencyMap map[string]map[string]bool

func (m *MetadataDependencyMap) AddMap(keys map[string]bool, metadataType string) error {
	for key := range keys {
		err := m.AddItem(metadataType, key)
		if err != nil {
			return err
		}
	}
	return nil
}

func (m *MetadataDependencyMap) AddRequired(change *wire.ChangeItem, metadataType, fieldName string) error {
	metadataName, err := change.GetFieldAsString(fieldName)
	if err != nil || metadataName == "" {
		return errors.New("Missing metadata item in field: " + fieldName)
	}
	return m.AddItem(metadataType, metadataName)
}

func (m *MetadataDependencyMap) AddOptional(change *wire.ChangeItem, metadataType, fieldName string) error {
	metadataName, err := change.GetFieldAsString(fieldName)
	if err != nil || metadataName == "" {
		return nil
	}
	return m.AddItem(metadataType, metadataName)
}

func (m *MetadataDependencyMap) AddItem(metadataType, metadataName string) error {
	_, ok := (*m)[metadataType]
	if !ok {
		(*m)[metadataType] = map[string]bool{}
	}
	(*m)[metadataType][metadataName] = true
	return nil
}

func (m *MetadataDependencyMap) GetItems() ([]meta.BundleableItem, error) {
	var items []meta.BundleableItem

	collections, ok := (*m)["collection"]
	if ok {
		collectionItems, err := meta.NewCollections(collections)
		if err != nil {
			return nil, err
		}
		items = append(items, collectionItems...)
	}

	views, ok := (*m)["view"]
	if ok {
		viewItems, err := meta.NewViews(views)
		if err != nil {
			return nil, err
		}
		items = append(items, viewItems...)
	}

	themes, ok := (*m)["theme"]
	if ok {
		themeItems, err := meta.NewThemes(themes)
		if err != nil {
			return nil, err
		}
		items = append(items, themeItems...)
	}

	labels, ok := (*m)["label"]
	if ok {
		labelItems, err := meta.NewLabels(labels)
		if err != nil {
			return nil, err
		}
		items = append(items, labelItems...)
	}

	selectlists, ok := (*m)["selectlist"]
	if ok {
		selectlistItems, err := meta.NewSelectLists(selectlists)
		if err != nil {
			return nil, err
		}
		items = append(items, selectlistItems...)
	}

	return items, nil
}

func getIDsFromUpdatesAndDeletes(request *wire.SaveOp) []string {
	keys := make([]string, len(request.Updates)+len(request.Deletes))
	index := 0
	for i := range request.Updates {
		keys[index] = request.Updates[i].IDValue
		index++
	}
	for i := range request.Deletes {
		keys[index] = request.Deletes[i].IDValue
		index++
	}
	return keys
}

func getUniqueKeysFromUpdatesAndDeletes(request *wire.SaveOp) []string {
	keys := make([]string, len(request.Updates)+len(request.Deletes))
	index := 0
	for i := range request.Updates {
		keys[index] = request.Updates[i].UniqueKey
		index++
	}
	for i := range request.Deletes {
		keys[index] = request.Deletes[i].UniqueKey
		index++
	}
	return keys
}

func getUniqueKeysFromDeletes(request *wire.SaveOp) []string {
	keys := make([]string, len(request.Deletes))
	index := 0
	for i := range request.Deletes {
		keys[index] = request.Deletes[i].UniqueKey
		index++
	}
	return keys
}

func checkValidItems(workspaceID string, items []meta.BundleableItem, session *sess.Session, connection wire.Connection) error {
	if len(items) == 0 {
		return nil
	}

	wsSession, err := datasource.AddWorkspaceContextByID(workspaceID, session, connection)
	if err != nil {
		return err
	}
	return bundle.IsValid(items, wsSession, connection)

}

func requireValue(change *wire.ChangeItem, fieldName string) (string, error) {

	value, err := change.GetFieldAsString(fieldName)
	valueIsUndefined := err != nil
	valueIsEmpty := value == ""
	isMissingInsert := change.IsNew && (valueIsUndefined || valueIsEmpty)
	isMissingUpdate := !change.IsNew && !valueIsUndefined && valueIsEmpty
	if isMissingInsert || isMissingUpdate {
		return "", errors.New(fieldName + " is required")
	}

	return value, nil

}

func getRequiredParameter(params map[string]interface{}, paramName string) (string, error) {
	if paramValue, hasParam := params[paramName]; hasParam {
		if stringValue, isString := paramValue.(string); isString {
			return stringValue, nil
		}
	}
	return "", exceptions.NewInvalidParamException("system bot: missing required parameter "+paramName, paramName)
}

func isTextAlike(fieldType string) bool {
	if fieldType == "TEXT" || fieldType == "AUTONUMBER" || fieldType == "EMAIL" || fieldType == "LONGTEXT" || fieldType == "SELECT" || fieldType == "DATE" {
		return true
	}
	return false
}
