/**
 * @fileoverview Flag for loops which modify their iteration variable in their body
 * @author Nicolas Feignon <nfeignon@gmail.com>
 */

"use strict";

module.exports = {

	meta: {

		docs: {
			recommended: true,
			type: "error",
			description: "Flag for loops which modify their iteration variable in their body"
		},

		schema: []

	},

	create: function (context) {

		function inspectLoopStatement(emitted) {
			const node = emitted.node;

			if (emitted.exit || !node.init || node.init.type !== "AssignmentExpression") {
				return;
			}

			let iterationVariable = node.init.left.name;

			for (let expr of node.body.body) {
				if (expr.type !== "ExpressionStatement") {
					continue;
				}

				let name;

				if (expr.expression.type === "AssignmentExpression" && expr.expression.left.type === "Identifier") {
					name = expr.expression.left.name;
				} else if (expr.expression.type === "UpdateExpression" && expr.expression.argument.type === "Identifier") {
					name = expr.expression.argument.name;
				} else {
					continue;
				}

				if (name === iterationVariable) {
					context.report({
						node: expr,
						message: "Iterator variable modified in for loop."
					});
				}
			}
		}

		return {
			ForStatement: inspectLoopStatement
		};

	}

};
