#!/bin/bash
function is_int() { return $(test "$@" -eq "$@" > /dev/null 2>&1); }
ssh-add -D
git config --global --unset user.name
git config --global --unset user.email
git config user.name "3399396355"
git config user.email "noalineado3@gmail.com"
ssh-add -k /Users/morpheous/.ssh/githubNoAlineado

LastCommit=$(git log -1 --pretty="%B" | xargs)
# https://stackoverflow.com/a/3626205
if $(is_int "${LastCommit}");
    then
    NextCommitNumber=$((LastCommit+1))
else
   echo "Not an integer Resetting"
   NextCommitNumber=1
fi
#echo "$NextCommitNumber"
git add .
git commit -m "$NextCommitNumber"
git remote add origin git@github.com:3399396355/RedisServer.git
git push origin master
