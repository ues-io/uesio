package localbundlestore

import (
	"bufio"
	"errors"
	"io"
	"io/ioutil"
	"os"
	"path/filepath"
	"strings"

	"github.com/thecloudmasters/uesio/pkg/reqs"
)

// FileAdapter struct
type LocalBundleStore struct {
}

func getBasePath(namespace, version string) string {
	// We're ignoring the version here because we always get the latest
	return filepath.Join("..", "..", "libs", "uesioapps", namespace, "bundle")
}

func (b *LocalBundleStore) GetItem(namespace string, version string, objectname string, name string) (*bufio.Reader, io.Closer, error) {
	filePath := filepath.Join(getBasePath(namespace, version), objectname, name)
	file, err := os.Open(filePath)
	if err != nil {
		return nil, nil, err
	}
	reader := bufio.NewReader(file)
	return reader, file, nil
}

func (b *LocalBundleStore) ListItems(namespace string, version string, objectname string) ([]string, error) {
	dirPath := filepath.Join(getBasePath(namespace, version), objectname)
	files, err := ioutil.ReadDir(dirPath)
	if err != nil {
		return []string{}, nil
	}
	keys := make([]string, len(files))
	for i, file := range files {
		fileName := file.Name()
		if !strings.HasSuffix(fileName, ".yaml") {
			continue
		}
		keys[i] = fileName
	}
	return keys, nil
}

func (b *LocalBundleStore) StoreItems(namespace string, version string, itemStreams []reqs.ItemStream) error {
	for _, itemStream := range itemStreams {
		err := storeItem(namespace, version, itemStream)
		if err != nil {
			return err
		}
	}
	return nil
}

func storeItem(namespace string, version string, itemStream reqs.ItemStream) error {
	fullFilePath := filepath.Join(getBasePath(namespace, version), itemStream.Path)
	directory := filepath.Dir(fullFilePath)

	err := os.MkdirAll(directory, 0744)
	if err != nil {
		return err
	}

	outFile, err := os.Create(fullFilePath)
	if err != nil {
		return errors.New("Error Creating File: " + err.Error())
	}
	defer outFile.Close()
	_, err = io.Copy(outFile, &itemStream.Buffer)
	if err != nil {
		return errors.New("Error Writing File: " + err.Error())
	}

	return nil
}
