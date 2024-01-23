package zip

import (
	"archive/zip"
	"bytes"
	"fmt"
	"io"
	"io/fs"
	"os"
	"path/filepath"
	"strings"
)

func getCombinedPath(filename, dest string) (string, error) {
	if dest == "" {
		return filename, nil
	}
	path := filepath.Join(dest, filename)

	// Check for ZipSlip (Directory traversal)
	if !strings.HasPrefix(path, filepath.Clean(dest)+string(os.PathSeparator)) {
		fmt.Println(filepath.Clean(dest) + string(os.PathSeparator))
		return "", fmt.Errorf("illegal file path: %s", path)
	}

	return path, nil
}

func extract(zf *zip.File, dest string) error {
	rc, err := zf.Open()
	if err != nil {
		return err
	}
	defer rc.Close()

	path, err := getCombinedPath(zf.Name, dest)
	if err != nil {
		return err
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
		if _, isPathErr := err.(*fs.PathError); isPathErr {
			return nil
		}
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
	bodybytes, err := io.ReadAll(data)
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
