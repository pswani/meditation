git checkout $1
git pull origin $2
git merge $2
git push origin $1
git branch -D $2