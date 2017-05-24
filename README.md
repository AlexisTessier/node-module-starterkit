node-module-starterkit
======================

A git only starterkit for writing a node module

This is not intended to be used from npm. Directly git clone the repo, then run :

```
npm run init
```

It will:

+ install the dependencies
+ remove the .git directory
+ ask for some inputs which will be injected in some files
+ remove this README.md
+ remove the node-module-starterkit.gitkeep files
+ remove the init-XX.js files
+ uninstall the unneeded dependencies