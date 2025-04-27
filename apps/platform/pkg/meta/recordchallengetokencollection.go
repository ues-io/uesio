package meta

import (
	"errors"
	"fmt"
	"strconv"
	"strings"
)

type RecordChallengeTokenCollection []*RecordChallengeToken

var RECORDCHALLENGETOKEN_COLLECTION_NAME = "uesio/studio.recordchallengetoken"
var RECORDCHALLENGETOKEN_FOLDER_NAME = "recordchallengetokens"
var RECORDCHALLENGETOKEN_FIELDS = StandardGetFields(&RecordChallengeToken{})

func (rctc *RecordChallengeTokenCollection) GetName() string {
	return RECORDCHALLENGETOKEN_COLLECTION_NAME
}

func (rctc *RecordChallengeTokenCollection) GetBundleFolderName() string {
	return RECORDCHALLENGETOKEN_FOLDER_NAME
}

func (rctc *RecordChallengeTokenCollection) GetFields() []string {
	return RECORDCHALLENGETOKEN_FIELDS
}

func (rctc *RecordChallengeTokenCollection) NewItem() Item {
	return &RecordChallengeToken{}
}

func (rctc *RecordChallengeTokenCollection) AddItem(item Item) error {
	*rctc = append(*rctc, item.(*RecordChallengeToken))
	return nil
}

func (rctc *RecordChallengeTokenCollection) GetItemFromPath(path, namespace string) BundleableItem {
	parts := strings.Split(path, "/")
	partLength := len(parts)
	if partLength != 4 {
		return nil
	}
	collectionKey := fmt.Sprintf("%s/%s.%s", parts[0], parts[1], parts[2])
	name := strings.TrimSuffix(parts[3], ".yaml")
	return NewBaseRecordChallengeToken(collectionKey, namespace, name)
}

func (rctc *RecordChallengeTokenCollection) GetItemFromKey(key string) (BundleableItem, error) {
	keyArray := strings.Split(key, ":")
	if (len(keyArray)) != 2 {
		return nil, errors.New("invalid record challenge token key")
	}
	return NewRecordChallengeToken(keyArray[0], keyArray[1])
}

func (rctc *RecordChallengeTokenCollection) FilterPath(path string, conditions BundleConditions, definitionOnly bool) bool {
	return GroupedPathFilter(path, "uesio/studio.collection", conditions)
}

func (rctc *RecordChallengeTokenCollection) Loop(iter GroupIterator) error {
	for index, uat := range *rctc {
		err := iter(uat, strconv.Itoa(index))
		if err != nil {
			return err
		}
	}
	return nil
}

func (rctc *RecordChallengeTokenCollection) Len() int {
	return len(*rctc)
}
