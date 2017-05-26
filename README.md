node-module-starterkit
======================

A git only starterkit for writing a node module

This is not intended to be used from npm. Directly git clone the repo, then run the init script.

```
npm run kit-init
```

It will:

+ remove this README.md
+ remove the package.json
+ remove the .git directory if present
+ run git init
+ run npm init
+ ask for some inputs which will be used to complete the package.json
+ complete the package.json with useful dev scripts et dependencies
+ run git remote add origin [git/repository/in/the/npm/package/if/founded]
+ removes files used by node-module-starter-kit
+ install the dependencies (npm i)
+ Make an initial commit
+ create a release branch