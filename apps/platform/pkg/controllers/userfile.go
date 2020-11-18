package controllers

import (
	"net/http"
	"strconv"

	"github.com/thecloudmasters/uesio/pkg/filesource"
	"github.com/thecloudmasters/uesio/pkg/logger"
	"github.com/thecloudmasters/uesio/pkg/middlewares"
	"github.com/thecloudmasters/uesio/pkg/reqs"
)

// UploadUserFile function
func UploadUserFile(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("content-type", "text")
	session := middlewares.GetSession(r)
	details, err := reqs.ConvertQueryToFileDetails(r.URL.Query())
	if err != nil {
		w.Write([]byte(err.Error()))
		return
	}
	//Attach file length to the details
	contentLenHeader := r.Header.Get("Content-Length")
	contentLen, err := strconv.ParseUint(contentLenHeader, 10, 64)
	if err != nil {
		w.Write([]byte("Must attach header 'Content-Length' with file upload"))
		return
	}
	details.ContentLength = contentLen

	newID, err := filesource.Upload(r.Body, *details, session)
	if err != nil {
		logger.LogError(err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.Write([]byte(newID))
}

// DownloadUserFile function
func DownloadUserFile(w http.ResponseWriter, r *http.Request) {
	session := middlewares.GetSession(r)
	userFileID := r.URL.Query().Get("userfileid")
	if userFileID == "" {
		w.Header().Set("content-type", "text")
		w.Write([]byte("No userfileid in the request URL query"))
		return
	}
	fileStream, userFile, err := filesource.Download(userFileID, session)
	if err != nil {
		w.Header().Set("content-type", "text")
		w.Write([]byte("Unable to load file"))
		return
	}

	respondFile(w, r, userFile.MimeType, fileStream)
}

// DeleteUserFile function
func DeleteUserFile(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("content-type", "text")
	session := middlewares.GetSession(r)
	userFileID := r.URL.Query().Get("userfileid")
	if userFileID == "" {
		w.Write([]byte("No userfileid in the request URL query"))
		return
	}

	err := filesource.Delete(userFileID, session)
	if err != nil {
		w.Write([]byte(err.Error()))
		return
	}
	w.Write([]byte("ok"))
}
