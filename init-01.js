'use strict';

const path = require('path');
const fs = require('fs');

const pkg = require('./package.json')

/*----------------------------------------------*/

function foundObjectVariables(obj) {
	const objectVariables = {};
	let containsVariable = false;

	for(const key in obj){
		let variable = obj[key];

		if (typeof variable === 'object') {
			variable = foundObjectVariables(variable);

			if (variable) {
				containsVariable = true;
				objectVariables[key] = variable;
			}
		}
		else if (
			typeof variable === 'string' &&
			variable.length > 6 &&
			variable.indexOf('###') === 0 &&
			variable.lastIndexOf('###') === (variable.length - 3)
		) {
			containsVariable = true;
			objectVariables[key] = variable.substring(3, variable.length - 3);
		}
	}

	return containsVariable ? objectVariables : null;
}

const packageVariables = foundObjectVariables(pkg);

/*----------------------------------------------*/

function replaceObjectVariables(obj, variables, values = {}){
	for(const key in obj){
		const variable = variables[key];
		if (variable) {
			const originaValue = obj[key];

			if (typeof originaValue === 'object') {
				replaceObjectVariables(obj[key], variable, values[key] || {})
			}
			else if (typeof originaValue === 'string') {
				obj[key] = values[key] || 'tmp-value'
			}
		}
	}
}

replaceObjectVariables(pkg, packageVariables);

fs.writeFileSync(path.join(__dirname, 'tmp.package.json'), JSON.stringify(pkg), {encoding:'utf-8'});