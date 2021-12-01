package datasource

import (
	"errors"

	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/meta/loadable"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

type OpList struct {
	CollectionName string
	WireName       string
	Options        *adapt.SaveOptions
	List           []*adapt.SaveOp
	Counter        int
	CurrentIndex   int
}

func (ol *OpList) getCurrentIndex() int {
	if ol.Counter == adapt.MAX_BATCH_SIZE {
		ol.Counter = 0
		ol.CurrentIndex++
	}
	if ol.Counter == 0 {
		ol.List = append(ol.List, &adapt.SaveOp{
			CollectionName: ol.CollectionName,
			WireName:       ol.WireName,
			Inserts:        &adapt.ChangeItems{},
			Updates:        &adapt.ChangeItems{},
			Deletes:        &adapt.ChangeItems{},
			Options:        ol.Options,
		})
	}
	ol.Counter++
	return ol.CurrentIndex
}

func (ol *OpList) addInsert(item loadable.Item, recordKey interface{}) {
	currentIndex := ol.getCurrentIndex()
	*ol.List[currentIndex].Inserts = append(*ol.List[currentIndex].Inserts, adapt.ChangeItem{
		FieldChanges: item,
		RecordKey:    recordKey,
	})
}

func (ol *OpList) addUpdate(item loadable.Item, recordKey interface{}, idValue interface{}) {
	currentIndex := ol.getCurrentIndex()
	*ol.List[currentIndex].Updates = append(*ol.List[currentIndex].Updates, adapt.ChangeItem{
		IDValue:      idValue,
		FieldChanges: item,
		RecordKey:    recordKey,
	})
}

func (ol *OpList) addDelete(item loadable.Item, idValue interface{}) {
	currentIndex := ol.getCurrentIndex()
	*ol.List[currentIndex].Deletes = append(*ol.List[currentIndex].Deletes, adapt.ChangeItem{
		FieldChanges: item,
		IDValue:      idValue,
	})
}

func NewOpList(request *SaveRequest) *OpList {
	return &OpList{
		CollectionName: request.Collection,
		WireName:       request.Wire,
		Options:        request.Options,
		List:           []*adapt.SaveOp{},
	}
}

func SplitSave(request *SaveRequest, collectionMetadata *adapt.CollectionMetadata, session *sess.Session) ([]*adapt.SaveOp, error) {

	opList := NewOpList(request)

	if request.Changes != nil {
		err := request.Changes.Loop(func(item loadable.Item, recordKey interface{}) error {
			idValue, err := item.GetField(collectionMetadata.IDField)
			if err != nil || idValue == nil || idValue.(string) == "" {
				opList.addInsert(item, recordKey)
			} else {
				opList.addUpdate(item, recordKey, idValue)
			}
			return nil
		})
		if err != nil {
			return nil, err
		}
	}

	if request.Deletes != nil {
		err := request.Deletes.Loop(func(item loadable.Item, _ interface{}) error {
			idValue, err := item.GetField(collectionMetadata.IDField)
			if err != nil || idValue == nil || idValue.(string) == "" {
				return errors.New("bad id value for delete item")
			}
			opList.addDelete(item, idValue)
			return nil
		})
		if err != nil {
			return nil, err
		}
	}

	return opList.List, nil
}
