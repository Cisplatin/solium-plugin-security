/**
 * @fileoverview Disallow assigning to function parameters.
 * @author Simon Hajjar <simon.j.hajjar@gmail.com>
 */

"use strict";

module.exports = {

	meta: {

		docs: {
			recommended: true,
			type: "error",
			description: "Discourage assigning values to function parameters"
		},

		schema: []
	},

	create: function (context) {

		function isBadAssignment (statement, params) {
			return statement["expression"]["type"] === "AssignmentExpression" &&
                   params.indexOf(statement["expression"]["left"]["name"]) >= 0;
		}

		function isBadUpdate (statement, params) {
			return statement["expression"]["type"] === "UpdateExpression" &&
                   params.indexOf(statement["expression"]["argument"]["name"]) >= 0;

		}

		function checkExpressionStatement(statement, node, params) {
			let functionName = node.name ? `"${node.name}"` : "Fallback function";

			// TODO: Specify the exact parameter that is being updated and location of updation inside the func
			if(isBadAssignment(statement, params) || isBadUpdate(statement, params)) {
				context.report({
					node: node,
					message: `${functionName}: Avoid assigning to function parameters.`
				});
			}
		}

		function inspectStatement (statement, node, params, following) {
			if ("ExpressionStatement" === following["type"]) {
				checkExpressionStatement (following, node, params);
			} else if ("IfStatement" === following["type"]) {
				inspectIf (following, node, params);
			} else if (["ForStatement", "WhileStatement", "DoWhileStatement"].indexOf(following["type"]) >= 0) {
				inspectLoop (following, node, params);
			} else {
				inspectBody (following["body"], node, params);
			}
		}

		function inspectIf (statement, node, params) {
			inspectStatement (statement, node, params, statement["consequent"]);

			if (statement["alternate"] == null) { return; }
			inspectStatement (statement, node, params, statement["alternate"]);
		}

		function inspectLoop (statement, node, params) {
			inspectStatement (statement, node, params, statement["body"]);
		}

		function inspectBody (body, node, params) {
			for (let statement of body) {
				if ("ExpressionStatement" === statement["type"]) {
					checkExpressionStatement (statement, node, params);
				} else if (["ForStatement", "WhileStatement", "DoWhileStatement"].indexOf(statement["type"]) >= 0) {
					inspectLoop (statement, node, params);
				} else if ("IfStatement" === statement["type"]) {
					inspectIf (statement, node, params);
				}
			}
		}

		function inspectFunctionDeclaration (emitted) {
			if (emitted.exit || emitted.node.is_abstract) { return; }

			const node = emitted.node;

			let params = node.params.map(x => x["id"]);
			inspectBody (node.body.body, node, params);
		}

		return {
			FunctionDeclaration: inspectFunctionDeclaration
		};

	}

};
