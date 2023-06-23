#!/usr/bin/env bash

targetDir=$1
csvPath="$targetDir/upload.csv"

crnl="\r\n"

rm -f "$csvPath"
touch "$csvPath"
printf "uesio/core.recordid,uesio/core.fieldid,uesio/core.path" >> $csvPath

for dir in $(find "$targetDir/files" -type d -maxdepth 1)
do
    relative_dir=${dir#"$targetDir/files/"}

    if [[ $relative_dir == "" ]]
        then continue
    fi
    # We expect a very flat structure
    for file in $(find "$dir" -type f -maxdepth 1)
    do
        relative_file=${file#"$dir/"}
        if [[ $file == *".md" ]]; then
            printf "$crnl$relative_dir,uesio/cms.content,$relative_dir/$relative_file" >> $csvPath
        else
            printf "$crnl$relative_dir,,$relative_dir/$relative_file" >> $csvPath
        fi
    done
done
