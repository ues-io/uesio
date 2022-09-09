package command

import (
	"archive/zip"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"strings"

	"github.com/thecloudmasters/clio/pkg/auth"
	"github.com/thecloudmasters/clio/pkg/call"
	"github.com/thecloudmasters/clio/pkg/config"
)

func getLocalZip() io.Reader {
	// Set up the pipe to write data directly into the Reader.
	pr, pw := io.Pipe()
	// Write JSON-encoded data to the Writer end of the pipe.
	// Write in a separate concurrent goroutine, and remember
	// to Close the PipeWriter, to signal to the paired PipeReader
	// that we’re done writing.
	go func() {
		// Zip the current directory
		w := zip.NewWriter(pw)

		walker := func(path string, info os.FileInfo, err error) error {
			if err != nil {
				return err
			}
			if info.IsDir() {
				return nil
			}
			file, err := os.Open(path)
			if err != nil {
				return err
			}
			defer file.Close()

			// Ensure that `path` is not absolute; it should not start with "/".
			// This snippet happens to work because I don't use
			// absolute paths, but ensure your real-world code
			// transforms path into a zip-root relative path.
			pathParts := strings.SplitN(path, string(filepath.Separator), 2)
			f, err := w.Create(pathParts[1])
			if err != nil {
				return err
			}

			_, err = io.Copy(f, file)
			if err != nil {
				return err
			}

			return nil
		}
		err := filepath.Walk("bundle", walker)
		if err != nil {
			fmt.Println("Error Zipping Bundle Dir: " + err.Error())
		}

		w.Close()
		pw.Close()
	}()
	return pr
}

func Deploy() error {

	fmt.Println("Running Deploy Command")

	_, err := auth.Login()
	if err != nil {
		return err
	}

	app, err := config.GetApp()
	if err != nil {
		return err
	}

	workspace, err := config.GetWorkspace()
	if err != nil {
		return err
	}

	sessid, err := config.GetSessionID()
	if err != nil {
		return err
	}

	url := fmt.Sprintf("workspace/%s/%s/metadata/deploy", app, workspace)
	payload := getLocalZip()

	resp, err := call.Request("POST", url, payload, sessid)
	if err != nil {
		return err
	}

	fmt.Println("Deploy Success")

	defer resp.Body.Close()

	return nil
}
