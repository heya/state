/* UMD.define */ (typeof define=="function"&&define||function(d,f,m){m={module:module,require:require};module.exports=f.apply(null,d.map(function(n){return m[n]||require(n)}))})
(['module', 'heya-unit', '../StateMachine'], function(module, unit, StateMachine){
	'use strict';

	function TestHost (t) {
		this.t = t;
		this.allow = true;
		this.logRed = false;
	}

	TestHost.prototype = {
		info: function (msg) {
			if (this.t) {
				this.t.info(msg);
			}
		},

		getNextState: function (stateMachine, action, args) {
			if (this.allow) {
				this.info('ACTION: ' + action);
				return stateMachine.getNextState(action, args);
			}
			return null;
		},

		onStateEnter: function (stateMachine, action, args, futureState) {
			this.info('ENTER: ' + stateMachine.current.names.join('-'));
			stateMachine.onStateEnter(action, args, futureState);
		},

		onStateExit: function (stateMachine, action, args, futureState) {
			this.info('EXIT: ' + stateMachine.current.names.join('-'));
			stateMachine.onStateExit(action, args, futureState);
		},

		// custom state callbacks

		onYellowEnter: function () {
			this.info('ENTER YELLOW');
		},

		onYellowExit: function () {
			this.info('EXIT YELLOW');
		},

		onRedEnter: function () {
			this.info('ENTER RED!');
		},

		onRedExit: function () {
			this.info('EXIT RED!');
		},

		onXRedEnter: function () {
			this.info('ENTER RED*');
		},

		onXRedExit: function () {
			this.info('EXIT RED*');
		},

		// generic state callbacks

		onStateSmRedEnter: function () {
			if (this.logRed) {
				this.info('ENTER RED');
			}
		},

		onStateSmRedExit: function () {
			if (this.logRed) {
				this.info('EXIT RED');
			}
		}
	};

	var sampleStates = {
		red: {
			transitions: {
				next: 'yellow'
			},
			children: {
				pink: {
					transitions: {
						prev: 'red',
						last: 'green'
					}
				}
			}
		},
		yellow: {
			enter: 'onYellowEnter',
			exit: 'onYellowExit',
			transitions: {
				next: 'green',
				prev: 'red'
			}
		},
		green: {
			transitions: {
				prev: 'yellow',
				reset: 'red',
				pink: 'red-pink'
			}
		}
	};

	function makeStateMethodName(stateNames, isEnter) {
		return 'on' + stateNames.map(function (name) {
			return name.charAt(0).toUpperCase() + name.substr(1);
		}).join('') + (isEnter ? 'Enter' : 'Exit');
	}

	function makeCssClass(stateNames) {
		return stateNames.slice(0).reverse().join('_') + '_x';
	}


	unit.add(module, [
		{
			test: function test_general (t) {
				t.ASSERT('typeof StateMachine == "function"');
				var sm = new StateMachine('sm', new TestHost(t), {});
				eval(t.TEST('sm.current === null'));
			},
			logs: []
		},
		{
			test: function test_initial_state (t) {
				var sm = new StateMachine('sm', new TestHost(t), sampleStates, {init: 'red'});
				eval(t.TEST('sm.current'));
				eval(t.TEST('sm.current.name === "red"'));
			},
			logs: ['ENTER: red']
		},
		{
			test: function test_initial_embedded_state (t) {
				var sm = new StateMachine('sm', new TestHost(t), sampleStates, {init: 'red-pink'});
				eval(t.TEST('sm.current'));
				eval(t.TEST('sm.current.name === "pink"'));
			},
			logs: ['ENTER: red', 'ENTER: red-pink']
		},
		{
			test: function test_to_green_and_back (t) {
				var sm = new StateMachine('sm', new TestHost(t), sampleStates, {init: 'red'});
				eval(t.TEST('sm.current'));
				eval(t.TEST('sm.current.name === "red"'));
				var success = sm.changeState('next');
				eval(t.TEST('success'));
				eval(t.TEST('sm.current.name === "yellow"'));
				success = sm.changeState('next');
				eval(t.TEST('success'));
				eval(t.TEST('sm.current.name === "green"'));
				success = sm.changeState('reset');
				eval(t.TEST('success'));
				eval(t.TEST('sm.current.name === "red"'));
			},
			logs: [
				'ENTER: red',
				'ACTION: next',  'EXIT: red',    'ENTER: yellow', 'ENTER YELLOW',
				'ACTION: next',  'EXIT: yellow', 'EXIT YELLOW',   'ENTER: green',
				'ACTION: reset', 'EXIT: green',  'ENTER: red'
			]
		},
		{
			test: function test_fail (t) {
				var sm = new StateMachine('sm', new TestHost(t), sampleStates, {init: 'red'});
				eval(t.TEST('sm.current'));
				eval(t.TEST('sm.current.name === "red"'));
				var success = sm.changeState('next');
				eval(t.TEST('success'));
				eval(t.TEST('sm.current.name === "yellow"'));
				success = sm.changeState('pink');
				eval(t.TEST('!success'));
				eval(t.TEST('sm.current.name === "yellow"'));
				sm.host.allow = false;
				success = sm.changeState('next');
				eval(t.TEST('!success'));
				eval(t.TEST('sm.current.name === "yellow"'));
				sm.host.allow = true;
				success = sm.changeState('next');
				eval(t.TEST('success'));
				eval(t.TEST('sm.current.name === "green"'));
				success = sm.changeState('reset');
				eval(t.TEST('success'));
				eval(t.TEST('sm.current.name === "red"'));
			},
			logs: [
				'ENTER: red',
				'ACTION: next',  'EXIT: red',    'ENTER: yellow', 'ENTER YELLOW',
				'ACTION: pink',
				'ACTION: next',  'EXIT: yellow', 'EXIT YELLOW',   'ENTER: green',
				'ACTION: reset', 'EXIT: green',  'ENTER: red'
			]
		},
		{
			test: function test_from_embedded (t) {
				var sm = new StateMachine('sm', new TestHost(t), sampleStates, {init: 'red-pink'});
				eval(t.TEST('sm.current'));
				eval(t.TEST('sm.current.name === "pink"'));
				var success = sm.changeState('last');
				eval(t.TEST('success'));
				eval(t.TEST('sm.current.name === "green"'));
				success = sm.changeState('prev');
				eval(t.TEST('success'));
				eval(t.TEST('sm.current.name === "yellow"'));
			},
			logs: [
				'ENTER: red',   'ENTER: red-pink',
				'ACTION: last', 'EXIT: red-pink',  'EXIT: red',     'ENTER: green',
				'ACTION: prev', 'EXIT: green',     'ENTER: yellow', 'ENTER YELLOW'
			]
		},
		{
			test: function test_to_embedded (t) {
				var sm = new StateMachine('sm', new TestHost(t), sampleStates, {init: 'green'});
				eval(t.TEST('sm.current'));
				eval(t.TEST('sm.current.name === "green"'));
				var success = sm.changeState('pink');
				eval(t.TEST('success'));
				eval(t.TEST('sm.current.name === "pink"'));
			},
			logs: [
				'ENTER: green',
				'ACTION: pink', 'EXIT: green', 'ENTER: red', 'ENTER: red-pink'
			]
		},
		{
			test: function test_deep_transition (t) {
				var sm = new StateMachine('sm', new TestHost(t), sampleStates, {init: 'red-pink'});
				sm.changeState('prev'); // red
				sm.changeState('next'); // yellow
				sm.changeState('next'); // green
				sm.changeState('pink'); // red-pink
			},
			logs: [
				'ENTER: red',   'ENTER: red-pink',
				'ACTION: prev', 'EXIT: red-pink',
				'ACTION: next', 'EXIT: red',       'ENTER: yellow', 'ENTER YELLOW',
				'ACTION: next', 'EXIT: yellow',    'EXIT YELLOW',   'ENTER: green',
				'ACTION: pink', 'EXIT: green',     'ENTER: red',    'ENTER: red-pink'
			]
		},
		{
			test: function test_deep_transition_generic_handler (t) {
				var sm = new StateMachine('sm', new TestHost(t), sampleStates, {init: 'red-pink'});
				sm.host.logRed = true;
				sm.changeState('prev'); // red
				sm.changeState('next'); // yellow
				sm.changeState('next'); // green
				sm.changeState('pink'); // red-pink
			},
			logs: [
				'ENTER: red',   'ENTER: red-pink',
				'ACTION: prev', 'EXIT: red-pink',
				'ACTION: next', 'EXIT: red',       'EXIT RED',    'ENTER: yellow', 'ENTER YELLOW',
				'ACTION: next', 'EXIT: yellow',    'EXIT YELLOW', 'ENTER: green',
				'ACTION: pink', 'EXIT: green',     'ENTER: red',  'ENTER RED',     'ENTER: red-pink'
			]
		},
		{
			test: function test_deep_transition_custom_prefix (t) {
				var sm = new StateMachine('sm', new TestHost(t), sampleStates, {
						init: 'red-pink',
						stateMethodName: 'onX'
					});
				sm.changeState('prev'); // red
				sm.changeState('next'); // yellow
				sm.changeState('next'); // green
				sm.changeState('pink'); // red-pink
			},
			logs: [
				'ENTER: red',   'ENTER RED*',    'ENTER: red-pink',
				'ACTION: prev', 'EXIT: red-pink',
				'ACTION: next', 'EXIT: red',     'EXIT RED*',       'ENTER: yellow', 'ENTER YELLOW',
				'ACTION: next', 'EXIT: yellow',  'EXIT YELLOW',     'ENTER: green',
				'ACTION: pink', 'EXIT: green',   'ENTER: red',      'ENTER RED*',    'ENTER: red-pink'
			]
		},
		{
			test: function test_deep_transition_custom_handler (t) {
				var sm = new StateMachine('sm', new TestHost(t), sampleStates, {
						init: 'red-pink',
						stateMethodName: makeStateMethodName
					});
				sm.changeState('prev'); // red
				sm.changeState('next'); // yellow
				sm.changeState('next'); // green
				sm.changeState('pink'); // red-pink
			},
			logs: [
				'ENTER: red',   'ENTER RED!',     'ENTER: red-pink',
				'ACTION: prev', 'EXIT: red-pink',
				'ACTION: next', 'EXIT: red',      'EXIT RED!',       'ENTER: yellow', 'ENTER YELLOW',
				'ACTION: next', 'EXIT: yellow',   'EXIT YELLOW',     'ENTER: green',
				'ACTION: pink', 'EXIT: green',    'ENTER: red',      'ENTER RED!',    'ENTER: red-pink'
			]
		}
	]);

	if (typeof document !== 'undefined') {
		unit.add(module, [
			function test_css_classes (t) {
				var root = document.createElement('div');
				var sm = new StateMachine('sm', new TestHost(), sampleStates, {init: 'red-pink', root: root});
				eval(t.TEST('root.className === "sm-red sm-red-pink"'));
				sm.changeState('prev'); // red
				eval(t.TEST('root.className === "sm-red"'));
				sm.changeState('next'); // yellow
				eval(t.TEST('root.className === "sm-yellow"'));
				sm.changeState('next'); // green
				eval(t.TEST('root.className === "sm-green"'));
				sm.changeState('pink'); // red-pink
				eval(t.TEST('root.className === "sm-red sm-red-pink"'));
			},
			function test_css_prefix (t) {
				var root = document.createElement('div');
				var sm = new StateMachine('sm', new TestHost(), sampleStates, {
						init: 'red-pink',
						root: root,
						cssClass: 'x-'
					});
				eval(t.TEST('root.className === "x-red x-red-pink"'));
				sm.changeState('prev'); // red
				eval(t.TEST('root.className === "x-red"'));
				sm.changeState('next'); // yellow
				eval(t.TEST('root.className === "x-yellow"'));
				sm.changeState('next'); // green
				eval(t.TEST('root.className === "x-green"'));
				sm.changeState('pink'); // red-pink
				eval(t.TEST('root.className === "x-red x-red-pink"'));
			},
			function test_css_mapper (t) {
				var root = document.createElement('div');
				var sm = new StateMachine('sm', new TestHost(), sampleStates, {
						init: 'red-pink',
						root: root,
						cssClass: makeCssClass
					});
				eval(t.TEST('root.className === "red_x pink_red_x"'));
				sm.changeState('prev'); // red
				eval(t.TEST('root.className === "red_x"'));
				sm.changeState('next'); // yellow
				eval(t.TEST('root.className === "yellow_x"'));
				sm.changeState('next'); // green
				eval(t.TEST('root.className === "green_x"'));
				sm.changeState('pink'); // red-pink
				eval(t.TEST('root.className === "red_x pink_red_x"'));
			}
		]);
	}

	return {};
});
