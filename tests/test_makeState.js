/* UMD.define */ (typeof define=="function"&&define||function(d,f,m){m={module:module,require:require};module.exports=f.apply(null,d.map(function(n){return m[n]||require(n)}))})
(["module", "heya-unit", "../StateMachine", "../makeState"],
function(module, unit, StateMachine, makeState){
	'use strict';


	function TestHost(t) {
		this.t = t;
	}

	TestHost.prototype = {
		info: function (msg) {
			if (this.t) {
				this.t.info(msg);
			}
		},

		getNextState: function (stateMachine, action, args) {
			this.info('ACTION: ' + action);
			return stateMachine.getNextState(action, args);
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

		onYellowEnter: function (stateMachine, action, args, futureState) {
			this.info('ENTER YELLOW');
		},

		onYellowExit: function (stateMachine, action, args, futureState) {
			this.info('EXIT YELLOW');
		}
	};

	function testCallback () {}


	unit.add(module, [
		{
			test: function test_to_green_and_back (t) {
				eval(t.ASSERT('typeof makeState == "function"'));
				var sm = new StateMachine('sm', new TestHost(t), makeState(
						'red    => next  => yellow',
						'yellow => next  => green',
						'yellow => prev  => red',
						'green  => prev  => yellow',
						'green  => reset => red'
					), {init: 'red'});
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
				'ACTION: next', 'EXIT: red', 'ENTER: yellow',
				'ACTION: next', 'EXIT: yellow', 'ENTER: green',
				'ACTION: reset', 'EXIT: green', 'ENTER: red'
			]
		},
		{
			test: function test_to_green_and_back_from_random (t) {
				var sm = new StateMachine('sm', new TestHost(t), makeState(
						'green  => reset => red',
						'yellow => prev  => red',
						'red    => next  => yellow',
						'green  => prev  => yellow',
						'yellow => next  => green'
					), {init: 'red'});
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
				'ACTION: next', 'EXIT: red', 'ENTER: yellow',
				'ACTION: next', 'EXIT: yellow', 'ENTER: green',
				'ACTION: reset', 'EXIT: green', 'ENTER: red'
			]
		},
		{
			test: function test_custom_handler (t) {
				var sm = new StateMachine('sm', new TestHost(t), makeState(
						'green  => reset => red',
						'yellow => prev  => red',
						'red    => next  => yellow',
						'green  => prev  => yellow',
						'yellow => next  => green',
						'yellow => ENTER => onYellowEnter',
						'yellow => EXIT  => onYellowExit'
					), {init: 'red'});
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
				'ACTION: next', 'EXIT: red', 'ENTER: yellow', 'ENTER YELLOW',
				'ACTION: next', 'EXIT: yellow', 'EXIT YELLOW', 'ENTER: green',
				'ACTION: reset', 'EXIT: green', 'ENTER: red'
			]
		},
		{
			test: function test_inlined_handler (t) {
				var sm = new StateMachine('sm', new TestHost(t), makeState(
						'green  => reset => red',
						'yellow => prev  => red',
						'red    => next  => yellow',
						'green  => prev  => yellow',
						'yellow => next  => green',
						'yellow => ENTER', function (stateMachine) {
							t.info('Yay!');
						},
						'yellow => EXIT  =>', function (stateMachine) {
							stateMachine.host.info('Nay!');
						}
					), {init: 'red'});
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
				'ACTION: next', 'EXIT: red', 'ENTER: yellow', 'Yay!',
				'ACTION: next', 'EXIT: yellow', 'Nay!', 'ENTER: green',
				'ACTION: reset', 'EXIT: green', 'ENTER: red'
			]
		},
		{
			test: function test_embedded_state (t) {
				var sm = new StateMachine('sm', new TestHost(t), makeState(
						'red      => next  => yellow',
						'red-pink => prev  => red',
						'red-pink => last  => green',
						'yellow   => next  => green',
						'yellow   => prev  => red',
						'green    => prev  => yellow',
						'green    => reset => red',
						'green    => pink  => red-pink'
					), {init: 'red-pink'});
				sm.changeState('prev'); // red
				sm.changeState('next'); // yellow
				sm.changeState('next'); // green
				sm.changeState('pink'); // red-pink
			},
			logs: [
				'ENTER: red', 'ENTER: red-pink',
				'ACTION: prev', 'EXIT: red-pink',
				'ACTION: next', 'EXIT: red', 'ENTER: yellow',
				'ACTION: next', 'EXIT: yellow', 'ENTER: green',
				'ACTION: pink', 'EXIT: green', 'ENTER: red', 'ENTER: red-pink'
			]
		},
		function test_classes_and_handlers (t) {
			var s = makeState(
					'green  => reset => red',
					'yellow => prev  => red',
					'red    => next  => yellow',
					'green  => prev  => yellow',
					'yellow => next  => green',
					'yellow => ENTER => onYellowEnter',
					'yellow => EXIT  => onYellowExit',
					'green  => EXIT  =>', testCallback,
					'red    => CLASS => ay-test-class'
				);
			eval(t.TEST('s.yellow.enter === "onYellowEnter"'));
			eval(t.TEST('s.yellow.exit === "onYellowExit"'));
			eval(t.TEST('s.green.exit === testCallback'));
			eval(t.TEST('s.red.cssClass === "ay-test-class"'));
		}
	]);

	return {};
});
