/* UMD.define */ (typeof define=="function"&&define||function(d,f,m){m={module:module,require:require};module.exports=f.apply(null,d.map(function(n){return m[n]||require(n)}))})
([], function(){
	'use strict';

	var splitter = /\s*=>\s*/g;

	function makeState (/* variable list of arguments */) {
		var states = {};

		for (var i = 0, n = arguments.length; i < n; ++i) {
			var arg = arguments[i];
			if (typeof arg != 'string') {
				console.error('heya.state.makeState: string was expected as argument #' + i + ', got', arg);
				throw Error('heya.state.makeState: string was expected as argument #' + i);
			}
			var parts = arg.split(splitter), fn;
			switch (parts.length) {
				case 3: // all parts are specified
					if (parts[2] || parts[1] === 'CLASS') {
						fn = parts[2] || '';
						if (parts[1] !== 'CLASS') {
							var stateActions = fn.split('-');
							if (stateActions.length > 1) {
								fn = stateActions;
							}
						}
						break;
					}
					parts.pop(); // drop the empty part
					// intentional fall down
				case 2: // two parts are there
					if (i + 1 == n) {
						console.error('heya.state.makeState: function was expected as argument #' + i + ', but missing');
						throw Error('heya.state.makeState: function was expected as argument #' + i + ', but missing');
					}
					fn = arguments[++i];
					if (typeof fn != 'function') {
						console.error('heya.state.makeState: function was expected as argument #' + i + ', got', fn);
						throw Error('heya.state.makeState: function was expected as argument #' + i);
					}
					break;
				default:
					console.error('heya.state.makeState: wrong format of a state as argument #' + i + ', got', arg);
					throw Error('heya.state.makeState: wrong format of a state as argument #' + i);
			}
			var action = parts[1], state = getState(states, parts[0]);
			switch (action) {
				case 'ENTER':
					state.enter = fn;
					break;
				case 'EXIT':
					state.exit = fn;
					break;
				case 'CLASS':
					state.cssClass = fn;
					break;
				default: // a generic action
					state.transitions[action] = fn;
					break;
			}
		}

		return states;
	}

	// Returns a state object by a hierarchical name.
	function getState (states, name) {
		var state = {children: states};
		name.split('-').forEach(function (stateName) {
			var newState = state.children[stateName];
			if (!newState) {
				newState = state.children[stateName] = {children: {}, transitions: {}};
			}
			state = newState;
		});
		return state;
	}

	return makeState;
});
