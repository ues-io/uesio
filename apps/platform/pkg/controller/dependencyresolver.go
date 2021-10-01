package controller

import (
	"net/http"
	"strings"

	"github.com/gorilla/mux"
	"github.com/thecloudmasters/uesio/pkg/bundle"
	"github.com/thecloudmasters/uesio/pkg/logger"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/meta/loadable"
	"github.com/thecloudmasters/uesio/pkg/middleware"
)

// MetadataList is good
func MetadataList(w http.ResponseWriter, r *http.Request) {
	session := middleware.GetSession(r)

	vars := mux.Vars(r)
	metadatatype := vars["type"]
	namespace := vars["namespace"]
	grouping := vars["grouping"]

	conditions := meta.BundleConditions{}

	// Special handling for fields for now
	if metadatatype == "fields" {
		conditions["studio.collection"] = grouping
	} else if metadatatype == "bots" {
		conditions["studio.type"] = grouping
	} else if metadatatype == "componentvariants" {
		conditions["studio.component"] = grouping
	}

	collection, err := meta.GetBundleableGroupFromType(metadatatype)
	if err != nil {
		logger.LogErrorWithTrace(r, err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	err = bundle.LoadAll(collection, namespace, conditions, session)
	if err != nil {
		logger.LogErrorWithTrace(r, err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	collectionKeyMap := map[string]bool{}

	err = collection.Loop(func(item loadable.Item, _ interface{}) error {
		var key string
		// Special handling for fields for now
		if metadatatype == "fields" {
			field := item.(*meta.Field)
			key = field.Namespace + "." + field.Name
			if field.CollectionRef != grouping {
				return nil
			}
		} else {
			key = item.(meta.BundleableItem).GetKey()
		}
		collectionKeyMap[key] = true
		return nil
	})
	if err != nil {
		logger.LogErrorWithTrace(r, err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	respondJSON(w, r, &collectionKeyMap)

}

// NamespaceList is good
func NamespaceList(w http.ResponseWriter, r *http.Request) {
	session := middleware.GetSession(r)
	namespaces := session.GetContextNamespaces()
	respondJSON(w, r, &namespaces)
}

func MetadataValue(w http.ResponseWriter, r *http.Request) {
	session := middleware.GetSession(r)
	vars := mux.Vars(r)

	metadatatype := vars["type"]
	key := vars["key"]

	// metadatatype := "fields"
	// key := "crm.contacts.crm.account"

	// metadatatype := "views"
	// key := "crm.contacts.crm.accounts"

	keyArray := strings.Split(key, ".")

	conditions := meta.BundleConditions{}

	grouping := keyArray[0] + "." + keyArray[1]

	// Special handling for fields for now
	if metadatatype == "fields" {
		conditions["studio.collection"] = grouping
	} else if metadatatype == "bots" {
		conditions["studio.type"] = grouping
	} else if metadatatype == "componentvariants" {
		conditions["studio.component"] = grouping
	}

	conditions["studio.name"] = keyArray[3] //TO-DO Better way to do this maybe ID???

	collection, err := meta.GetBundleableGroupFromType(metadatatype)
	if err != nil {
		logger.LogErrorWithTrace(r, err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	err = bundle.LoadAll(collection, keyArray[0], conditions, session)
	if err != nil {
		logger.LogErrorWithTrace(r, err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	//collectionKeyMap := map[string]loadable.Item{}
	var collectionItem loadable.Item

	err = collection.Loop(func(item loadable.Item, _ interface{}) error {
		if metadatatype == "fields" {
			field := item.(*meta.Field)
			key = field.Namespace + "." + field.Name
			if field.CollectionRef != keyArray[0]+"."+keyArray[1] {
				return nil
			}
		} else {
			key = item.(meta.BundleableItem).GetKey()
		}
		collectionItem = item
		return nil
	})
	if err != nil {
		logger.LogErrorWithTrace(r, err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	respondJSON(w, r, &collectionItem)

}
