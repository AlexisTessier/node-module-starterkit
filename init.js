'use strict';

// fill the package json with the package.completion.json keys
// and ask for variables completions

const fs = require('fs');
const path = require('path');

const inquirer = require('inquirer');

/*----------------------------------------------*/

const pkg = require('./package.json');
const completions = require('./package.completion.json');

completions.author.name = pkg.author;

const variables = [];
findVariables(completions, variables);

replaceVariables(completions, variables).then(()=>{
	Object.assign(pkg, completions);

	fs.writeFileSync(path.join(__dirname, 'package.json'), JSON.stringify(pkg), {encoding: 'utf-8'});
});

/*----------------------------------------------*/

function findVariables(obj, variables) {
	for(const key in obj){
		let variable = obj[key];

		if (typeof variable === 'object') {
			findVariables(variable, variables);
		}
		else if (
			typeof variable === 'string' &&
			variable.length > 6 &&
			variable.indexOf('###') === 0 &&
			variable.lastIndexOf('###') === (variable.length - 3)
		) {
			if(!variables.includes(variable)){
				variables.push(variable);
			}
		}
	}
}

function replaceVariables(obj, objectVariables) {
	return inquirer.prompt(objectVariables.map(v => ({
		name: v,
		message: `enter ${v.substring(3, v.length - 3)}`,
		validate: input => input.length > 2
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
	});
}