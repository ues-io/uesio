package controllers

import (
	"errors"
	"net/http"
	"strconv"

	"github.com/thecloudmasters/uesio/pkg/filesource"
	"github.com/thecloudmasters/uesio/pkg/logger"
	"github.com/thecloudmasters/uesio/pkg/middlewares"
)

// UploadUserFile function
func UploadUserFile(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("content-type", "text")
	session := middlewares.GetSession(r)
	details, err := filesource.NewFileDetails(r.URL.Query())
	if err != nil {
		logger.LogError(err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	//Attach file length to the details
	contentLenHeader := r.Header.Get("Content-Length")
	contentLen, err := strconv.ParseUint(contentLenHeader, 10, 64)
	if err != nil {
		err := errors.New("Must attach header 'Content-Length' with file upload")
		logger.LogError(err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	details.ContentLength = contentLen

	newID, err := filesource.Upload(r.Body, *details, session)
	if err != nil {
		logger.LogError(err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	respondString(w, r, newID)
}

// DownloadUserFile function
func DownloadUserFile(w http.ResponseWriter, r *http.Request) {
	session := middlewares.GetSession(r)
	userFileID := r.URL.Query().Get("userfileid")
	if userFileID == "" {
		err := errors.New("No userfileid in the request URL query")
		logger.LogError(err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	fileStream, userFile, err := filesource.Download(userFileID, session)
	if err != nil {
		err := errors.New("Unable to load file")
		logger.LogError(err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	respondFile(w, r, userFile.MimeType, fileStream)
}
