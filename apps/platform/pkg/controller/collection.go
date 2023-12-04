package controller

import (
	"net/http"

	"github.com/thecloudmasters/uesio/pkg/controller/file"
	"github.com/thecloudmasters/uesio/pkg/types/exceptions"

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
	if err := collections.AddCollection(collectionName); err != nil {
		HandleError(w, err)
		return
	}

	metadataResponse := adapt.MetadataCache{}
	if err := collections.Load(&metadataResponse, session, nil); err != nil {
		HandleError(w, exceptions.NewBadRequestException("unable to load collection metadata: "+err.Error()))
		return
	}

	file.RespondJSON(w, r, &adapt.LoadResponseBatch{
		Collections: metadataResponse.Collections,
	})

}
