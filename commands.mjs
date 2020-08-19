import { parseArgs } from "./utils.mjs"


import { cmd_display_shape } from "./cmd_shapes.mjs";



let cmd_halt = {
	id: 'shapebot',
	type: 'always',
	fn(message, data) {
		if (
			!message.content.match(/shapebot/i) &&
			message.guild.id != '728969392569712670'
		) return 'halt';
	},
}

export let commands = {};




export let cmd_list = [
	cmd_halt,
	cmd_display_shape,
];



function runCommand(cmd, message, data) {
	if (cmd.type == 'fn') {
		let {s, args} = parseArgs(data.s, cmd.fname);
		if (!args) {
			return;
		}
		console.log(`running ${ cmd.id } with args [${ args }]...`)
		data.s = s;
		return cmd.fn(message, data, args)
	}
	if (cmd.type = 'match') {
		let m = data.s.match(cmd.fname)
		if (!m) {
			return;
		}
		console.log(`running ${ cmd.id }...`)
		data.s = data.s.replace(cmd.fname, '')
		return cmd.fn(message, data, m[0])
	}
	if (cmd.type = 'always') {
		console.log(`running ${ cmd.id }...`)
		return cmd.fn(message, data)
	}

	throw 'TODO';
}

export function onMessage(message) {
	console.log(message.content)
	let data = { message, s: message.cleanContent, value: null, cmd: null, };
	for (let cmd of cmd_list) {
		let value = runCommand(cmd, message, data);
		if (value) {
			data.value = value;
			data.cmd = cmd.id;
			if (value == 'halt') return;
		}
	}
}

console.log(commands);

export default commands;