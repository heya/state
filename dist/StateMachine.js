(function(_,f,g){g=window;g=g.heya||(g.heya={});g=g.state||(g.state={});g.StateMachine=f();})
([], function(){
	'use strict';

	function StateMachine (name, host, states, options) {
		// options = {root, init, cssClass, stateMethodName};
		options = options || {};

		this.current = null;
		this.name = name;
		this.host = host;
		this.root = options.root;
		this.init = options.init;

		var cssClass = options.cssClass || (this.name + '-'),
			makeCssClass = typeof cssClass == 'string' ? makeStandardCssClass(this, cssClass) : cssClass,
			stateMethodName = options.stateMethodName || ('onState' + this.name.charAt(0).toUpperCase() + this.name.substr(1)),
			makeStateMethodName = typeof stateMethodName == 'string' ? makeStandardStateMethodName(this, stateMethodName) : stateMethodName;
		this.states = collectStates(states, null, makeCssClass, makeStateMethodName);

		// enter the initial state
		if (!options.deferredInit) {
			this.initialize();
		}
	}

	StateMachine.prototype = {
		// the main method
		changeState: function (action, args) {
			var futureState = this.host.getNextState(this, action, args);
			if (futureState) {
				switchStates(this, futureState, action, args);
				return true;
			}
			return false;
		},
		initialize: function (init) {
			if (init) {
				this.init = init;
			}
			if (this.init) {
				switchStates(this, this.init, null, null);
			}
		},
		// StateMachine-supplied implementations for use by hosts
		getNextState: function (action, args) {
			return this.current.transitions[action] || null;
		},
		onStateEnter: function (action, args, futureState) {
			if (this.current) {
				if (this.root) {
					this.root.classList.add(this.current.cssClass);
				}
				var method = this.current.enter;
				if (method) {
					if (typeof method == 'string') {
						method = this.host[method];
					}
					if (method) {
						method.call(this.host, this, action, args, futureState);
					}
				}
			}
		},
		onStateExit: function (action, args, futureState) {
			if (this.current) {
				if (this.root) {
					this.root.classList.remove(this.current.cssClass);
				}
				var method = this.current.exit;
				if (method) {
					if (typeof method == 'string') {
						method = this.host[method];
					}
					if (method) {
						method.call(this.host, this, action, args, futureState);
					}
				}
			}
		}
	};

	// Default CSS mappers
	function makeStandardCssClass (stateMachine, prefix) {
		return function (stateNames) {
			return prefix + stateNames.join('-');
		};
	}

	// Default method name mappers
	function makeStandardStateMethodName (stateMachine, prefix) {
		return function (stateNames, isEnter) {
			return prefix + stateNames.map(function (name) {
					return name.charAt(0).toUpperCase() + name.substr(1);
				}).join('') + (isEnter ? 'Enter' : 'Exit');
		};
	}

	// The actual state switching algorithm.
	function switchStates (stateMachine, futureState, action, args) {
		if (typeof futureState == 'string') {
			futureState = futureState.split('-');
		}

		var prefixLength = 0;
		if (stateMachine.current) {
			// calculate the common prefix
			var names = stateMachine.current.names;
			while (prefixLength < names.length && prefixLength < futureState.length && names[prefixLength] == futureState[prefixLength]) {
				++prefixLength;
			}
			// exit the current state
			while (stateMachine.current && stateMachine.current.names.length > prefixLength) {
				stateMachine.host.onStateExit(stateMachine, action, args, futureState);
				stateMachine.current = stateMachine.current.parent;
			}
		}


		// enter the new state
		for (; prefixLength < futureState.length; ++prefixLength) {
			stateMachine.current = (stateMachine.current ? stateMachine.current.children : stateMachine.states)[futureState[prefixLength]];
			if (typeof stateMachine.current != 'object') {
				console.error('ERROR: state machine "' + stateMachine.name + '" has no state', futureState);
				return;
			}
			stateMachine.host.onStateEnter(stateMachine, action, args, futureState);
		}
	}

	// Collection routines to augment user-supplied state description with
	// useful technical information.

	function collectStates (states, parent, makeCssClass, makeStateMethodName) {
		var newStates = {};
		for (var stateName in states) {
			if (typeof states[stateName] == 'object') {
				newStates[stateName] = collectState(states, stateName, parent, makeCssClass, makeStateMethodName);
			}
		}
		return newStates;
	}

	function collectState (states, stateName, parent, makeCssClass, makeStateMethodName) {
		var state = Object.create(states[stateName]); // a delegation, so we don't touch the underlying project
		state.parent = parent;
		state.name   = stateName;
		state.names  = parent ? parent.names.concat(stateName) : [stateName];
		if (!state.cssClass) {
			state.cssClass = makeCssClass(state.names);
		}
		if (!state.enter) {
			state.enter = makeStateMethodName(state.names, true);
		}
		if (!state.exit) {
			state.exit = makeStateMethodName(state.names, false);
		}
		if (state.children) {
			state.children = collectStates(state.children, state, makeCssClass, makeStateMethodName);
		}
		return state;
	}

	return StateMachine;
});
