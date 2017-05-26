'use strict';

// fill the package json with the package.completion.json keys
// and ask for variables completions

const fs = require('fs');
const path = require('path');

const inquirer = require('inquirer');
const shell = require('shelljs')
const glob = require('glob')
const travisEncrypt = require('travis-encrypt');
const getNpmRegistryAuthToken = require('registry-auth-token');

/*----------------------------------------------*/

const variableStartMarker = '###';
const variableEndMarker = '###';

let defaultTravisNpmReleaseEncryptedApiKey = undefined;
const defaultVariablesGetter = {
	'###travis-npm-release-publisher-email###': answers => answers['###module-author-mail###'],
	'###travis-npm-release-encrypted-api-key###': () => defaultTravisNpmReleaseEncryptedApiKey,
	'###travis-npm-release-github-repository-name###': () => getGithubRepository() || undefined
};

/*----------------------------------------------*/

const pkg = require('./package.json');
const completions = require('./package.completion.json');

completions.author.name = pkg.author;
completions.travisYAMLContent = fs.readFileSync(path.join(__dirname, 'travis.tpl.yaml'), {encoding: 'utf-8'});

const variables = [];
findVariables(completions, variables);

replaceVariables(completions, variables).then(()=>{
	fs.writeFileSync(path.join(__dirname, '.travis.yaml'), completions.travisYAMLContent, {encoding: 'utf-8'});

	delete completions.travisYAMLContent;
	
	Object.assign(pkg, completions);

	fs.writeFileSync(path.join(__dirname, 'package.json'), JSON.stringify(pkg), {encoding: 'utf-8'});

	const gitUrl = getGitRepositoryUrl();

	if (gitUrl) {
		shell.exec(`git remote add origin ${gitUrl}`);
	}

	glob.sync(path.join(__dirname, '**/node-module-starterkit.gitkeep')).forEach(gitkeep => shell.exec(`rm -f ${gitkeep}`));
}).catch(err => {throw err;});

/*----------------------------------------------*/

function getGitRepositoryUrl() {
	if (
		typeof pkg.repository === 'object' &&
		pkg.repository.type === 'git' &&
		typeof pkg.repository.url === 'string'
	) {
		return pkg.repository.url.replace('git+https://', 'https://');
	}

	return null;
}

function getGithubRepository() {
	const gitUrl = getGitRepositoryUrl();

	const startMarker = 'https://github.com/';
	const endMarker = '.git';

	if (
		gitUrl &&
		gitUrl.indexOf(startMarker) === 0 &&
		gitUrl.lastIndexOf(endMarker) === gitUrl.length - endMarker.length
	) {
		return gitUrl.substring(startMarker.length, gitUrl.length - endMarker.length);
	}

	return null;
}

function findVariables(obj, variables) {
	for(const key in obj){
		let field = obj[key];

		if (typeof field === 'object') {
			findVariables(field, variables);
		}
		else if (typeof field === 'string') {
			const foundVariables = field.match(new RegExp(variableStartMarker+'([a-z]|-|[0-9])+'+variableEndMarker, 'ig'));

			if (foundVariables) {
				foundVariables.forEach(variable => {
					if(!variables.includes(variable)){
						variables.push(variable);
					}
				})
			}
		}
	}
}

function replaceVariables(obj, variableList) {
	if(variableList.length === 0){
		return Promise.resolve();
	}

	return new Promise((resolve, reject) => {
		function promptReplaceResolve() {
			inquirer.prompt(variableList.map(v => ({
				name: v,
				message: `enter ${v.substring(variableStartMarker.length, v.length - variableEndMarker.length)}`,
				validate: input => input.length > 2,
				default: defaultVariables[v] || undefined
			}))).then(answers => {
				function rep(obj, vars){
					for(const key in obj){
						let field = obj[key];

						if (typeof field === 'object') {
							rep(field, vars);
						}
						else if (
							typeof field === 'string'
						) {
							for(const varName in vars){
								const varValue = vars[varName];

								obj[key] = obj[key].replace(new RegExp(varName, 'g'), varValue);
							}
						}
					}
				}

				rep(obj, answers);
				resolve();
			});
		}

		const githubRepo = getGithubRepository();
		const npmToken = getNpmRegistryAuthToken();

		if (githubRepo && npmToken && npmToken.token) {
			travisEncrypt({
				repo: githubRepo,
				data: npmToken.token
			}, (err, blob)=>{
				if(err){reject(err);return;}

				defaultTravisNpmReleaseEncryptedApiKey = blob;
				promptReplaceResolve();
			});
		}
		else{
			promptReplaceResolve()
		}
	});
}