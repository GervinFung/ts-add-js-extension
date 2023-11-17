# update all packages to latest non-breaking versions
pnpm update
change_files=$(git diff --name-only)
if [ -z "$change_files" ];
then
    echo "Update Result -> No package to update"
    exit 0
fi

# commit changes
# ref: https://stackoverflow.com/a/35683029
git checkout update-package 2>/dev/null || git checkout -b update-package
git add .
git commit -m "chore(packages): update to latest non-breaking versions"

# update to latest breaking versions
pnpm update --latest
change_files=$(git diff --name-only)
if [ -z "$change_files" ];
then
    echo "Update Latest Result -> No package to update"
else
    echo "Update Latest Result -> Update to latest breaking versions"
    git add .
    git commit -m "chore(packages): update to latest breaking versions"
fi

# push changes
git push -u origin update-package
