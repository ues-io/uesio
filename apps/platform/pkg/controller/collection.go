package controller

import (
	"net/http"

	"github.com/gorilla/mux"
	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/middleware"
)

func GetCollectionMetadata(w http.ResponseWriter, r *http.Request) {

	session := middleware.GetSession(r)
	vars := mux.Vars(r)
	collectionName := vars["collectionname"]

	collections := datasource.MetadataRequest{
		Options: &datasource.MetadataRequestOptions{
			LoadAllFields: true,
		},
	}
	err := collections.AddCollection(collectionName)
	if err != nil {
		println(err)
	}

	metadataResponse := adapt.MetadataCache{}
	err = collections.Load(&metadataResponse, session)
	if err != nil {
		println(err)
	}

	respondJSON(w, r, &adapt.LoadResponseBatch{
		Collections: metadataResponse.Collections,
	})

}
