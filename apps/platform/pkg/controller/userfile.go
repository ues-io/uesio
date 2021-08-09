package controller

import (
	"errors"
	"net/http"
	"strconv"

	"github.com/gorilla/mux"
	"github.com/thecloudmasters/uesio/pkg/fileadapt"
	"github.com/thecloudmasters/uesio/pkg/filesource"
	"github.com/thecloudmasters/uesio/pkg/logger"
	"github.com/thecloudmasters/uesio/pkg/middleware"
)

// UploadUserFile function
func UploadUserFile(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("content-type", "text")
	session := middleware.GetSession(r)
	details, err := fileadapt.NewFileDetails(r.URL.Query())
	if err != nil {
		logger.LogError(err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	//Attach file length to the details
	contentLenHeader := r.Header.Get("Content-Length")
	contentLen, err := strconv.ParseUint(contentLenHeader, 10, 64)
	if err != nil {
		err := errors.New("must attach header 'content-length' with file upload")
		logger.LogError(err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	details.ContentLength = contentLen

	ufm, err := filesource.Upload(r.Body, *details, session)
	if err != nil {
		logger.LogError(err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	respondJSON(w, r, ufm)
}

func DeleteUserFile(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	userFileID := vars["fileid"]
	session := middleware.GetSession(r)
	// Load all the userfile records
	err := filesource.Delete(userFileID, session)
	if err != nil {
		logger.LogError(err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	respondJSON(w, r, &BotResponse{
		Success: true,
	})
}

// DownloadUserFile function
func DownloadUserFile(w http.ResponseWriter, r *http.Request) {
	session := middleware.GetSession(r)
	userFileID := r.URL.Query().Get("userfileid")
	if userFileID == "" {
		err := errors.New("no userfileid in the request url query")
		logger.LogError(err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	fileStream, userFile, err := filesource.Download(userFileID, session)
	if err != nil {
		err := errors.New("unable to load file:" + err.Error())
		logger.LogError(err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	respondFile(w, r, userFile.MimeType, fileStream)
}
