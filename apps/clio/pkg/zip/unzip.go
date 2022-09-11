package zip

import (
	"archive/zip"
	"bytes"
	"fmt"
	"io"
	"io/ioutil"
	"os"
	"path/filepath"
	"strings"
)

func extract(zf *zip.File, dest string) error {
	rc, err := zf.Open()
	if err != nil {
		return err
	}
	defer rc.Close()

	path := filepath.Join(dest, zf.Name)

	// Check for ZipSlip (Directory traversal)
	if !strings.HasPrefix(path, filepath.Clean(dest)+string(os.PathSeparator)) {
		return fmt.Errorf("illegal file path: %s", path)
	}

	if zf.FileInfo().IsDir() {
		return os.MkdirAll(path, 0744)
	}

	err = os.MkdirAll(filepath.Dir(path), 0744)
	if err != nil {
		return err
	}

	f, err := os.Create(path)
	if err != nil {
		return err
	}
	defer f.Close()

	_, err = io.Copy(f, rc)
	if err != nil {
		return err
	}

	return nil
}

func Unzip(data io.ReadCloser, dest string) error {

	// Unfortunately, we have to read the whole thing into memory
	bodybytes, err := ioutil.ReadAll(data)
	if err != nil {
		return err
	}
	defer data.Close()

	zipReader, err := zip.NewReader(bytes.NewReader(bodybytes), int64(len(bodybytes)))
	if err != nil {
		return err
	}

	os.MkdirAll(dest, 0755)

	for _, f := range zipReader.File {
		err := extract(f, dest)
		if err != nil {
			return err
		}
	}

	return nil
}
