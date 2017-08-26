#!/bin/bash -e
commit_message="$1"
if [$commit_message = ""]
then
    commit_message=":tada: update file" 
fi    
echo "$commit_message"
git add index.js arrange.js package.json README.md
git commit -m "$commit_message"
git push
