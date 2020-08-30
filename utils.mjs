export function parseArgs(s, fname) {
	let g_arg_var = ['`[^`]*`', '"[^"]*"', "'[^']*'", '[^,]*?'].slice(3)
	let g_arg_ws = ['\\s*`[^`]*`\\s*', '\\s*"[^"]*"\\s*', "\\s*'[^']*'\\s*", '[^,]*'].slice(3)
	let g_arg = `(${g_arg_ws.join('|')})?`
	let g_argnext = `(?:,${g_arg})?`
	let g = new RegExp(`${fname}\\(\\s*${g_arg}${g_argnext.repeat(9)}\\)`, 'i')
	let m = s.match(g)
	if (!m) return { s };
	s = s.replace(g, '')
	let args = m.slice(1).filter(e => e != null);
	for (let i = 0; i < args.length; i++) {
		for (let j = 0; j < g_arg_var.length; j++) {
			if (!args[i].match(new RegExp(`^${g_arg_ws[j]}$`))) continue;
			args[i] = args[i].match(new RegExp(`^\\s*(${g_arg_var[j]})\\s*$`))[1]
		}
	}
	return { s, args }
}

export function tryReplace(data, g, r = ' ') {
	if (!data.s.match(g)) {
		return false
	}
	data.s = data.s.replace(g, r)
	return true
}