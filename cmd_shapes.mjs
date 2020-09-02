import { Client, MessageAttachment } from 'discord.js';
import Canvas from 'canvas';

export * from "./shape.mjs";
import { allColorData, drawShape, customColors, customShapes, registerCustomColor, registerCustomShape, initColors, initShapes } from "./shape.mjs"
import { tryReplace, parseArgs } from "./utils.mjs";

function display_shape(message, data, args) {
    message.channel.send(imgShapeSingle(args[0] || "Cr", false, false))
}

export const cmd_display_shape = {
    type: 'fn',
    id: 'display_shape',
    fname: 'display_shape',
    fn: display_shape,
    main: true,
}

const rg_shape = /(?:\s|^)([^:\s]*:\S*|([A-Z][a-z]|--){4})|\n/g

export const cmd_any_shape = {
    type: 'always',
    id: 'any_shape',
    main: true,
    fn(message, data) {
        let as_rows = tryReplace(data, /as_rows|!/i)
        let no_err = tryReplace(data, /no_err|!/i)
        let no_key = tryReplace(data, /no_key|!/i)

        let d = parseArgs(data.s, 'size')
        data.s = d.s
        let size = d.args && +d.args[0] || 100

        let allShapesRaw = data.s.match(rg_shape)
        console.log({ s: data.s, allShapesRaw })
        if (!allShapesRaw || !allShapesRaw.find(e => e != '\n')) {
            return
        }
        allShapesRaw = allShapesRaw.map(e=>e=='\n'?e:e.trim())
        let row = []
        let grid = [row]
        let prev = '\n'
        for (let shape of allShapesRaw) {
            if (shape == '\n') {
                if (prev != '\n' && as_rows) {
                    grid.push(row = [])
                }
            } else {
                row.push(shape)
                d.s = d.s.replace(shape, ' ')
            }
            prev = shape
        }
        console.log({ grid })
        if (!row.length) {
            grid.pop()
        }

        message.channel.send(imgShapeGrid(grid, size, { no_key, no_err, as_rows }))
    }
}





export default [cmd_display_shape];






function imgShapeSingle(key, typeKey, typeErr) {
    let cv = Canvas.createCanvas(100, typeKey ? 120 : 100)
    let ctx = cv.getContext('2d')

    ctx.save()
    let errs = drawShape(key, cv, ctx, 100);
    ctx.restore()
    ctx.font = 'bold 16px "Courier New"'
    ctx.fillStyle = 'red'
    ctx.textAlign = 'start'
    ctx.textBaseline = 'top'
    if (errs && errs[0] && typeErr) {
        ctx.fillText(errs[0].message.replace(/<[^>]*>/g, ''), 0, 0, 100)
    }
    ctx.fillStyle = 'white'
    ctx.textAlign = 'end'
    ctx.textBaseline = 'bottom'
    if (typeKey)
        ctx.fillText(key, 100, 120, 100)

    console.log(key)
    return new MessageAttachment(cv.toBuffer(), `shape-${key}.png`)
}

function imgShapeGrid(grid, size, { no_key, no_err, as_rows }) {
    let keyH = no_key ? 0 : Math.ceil(size * 0.2)
    let cv = Canvas.createCanvas(size * Math.max(...grid.map(e => e.length)), (size + keyH) * grid.length)
    let ctx = cv.getContext('2d')

    let i = 0, j = 0;

    for (let row of grid) {
        for (let shape of row) {

            ctx.save()
            ctx.translate(i * size, j * (size + keyH))
            let errs = drawShape(shape, cv, ctx, size);
            ctx.font = `bold ${0.8 * keyH}px "Courier New"`
            if (errs && errs[0] && !no_err) {
                ctx.fillStyle = 'red'
                ctx.textAlign = 'start'
                ctx.textBaseline = 'top'
                ctx.fillText(errs[0].message.replace(/<[^>]*>/g, ''), 0, 0, size)
            }
            if (!no_key) {
                ctx.fillStyle = 'white'
                ctx.textAlign = 'end'
                ctx.textBaseline = 'bottom'
                ctx.fillText(shape, size, size + keyH, size)
            }

            ctx.restore()
            i++;
        }
        i = 0;
        j++;
    }
    return new MessageAttachment(cv.toBuffer(), `shape-${grid}.png`)
}



export const cmd_all_shapes = {
    type: 'match',
    id: 'all_shapes',
    fname: /all_shapes/i,
    fn: all_shapes,
    main: true,
}
function all_shapes(message, data, arg) {
    let all_shapes = ` ${Object.values(allShapeData).filter(e=>e.code.match(/[A-Z]/)).map(e=>e.code).join(': ')}: `
    data.s += all_shapes
}


export const cmd_all_colors = {
    type: 'match',
    id: 'all_colors',
    fname: /all_colors/i,
    fn: all_colors,
    main: true,
}
function all_colors(message, data, arg) {
    let all_colors = ` C${Object.values(allColorData).map(e=>e.code == '-' ? '-C-C-C-' : e.code).join(': C')}: `
    data.s += all_colors
}




export const cmd_add_color = {
    type: 'fn',
    id: 'add_color',
    fname: 'add_color',
    fn: add_color,
    main: true,
}
function add_color(message, data, args) {
    if (!args || !args.length) {
        message.channel.send('Invalid add_color form, use as  **add_color(`color` [, `symbol`] [, `name`] )**')
        return
    }
    let hex = args[0]
    let code = args[1] || hex.split('').filter(e=>e.match(/[a-z]/)).find(e=>!Object.values(allColorData).find(cl=>cl.code==e))
    if (!code) {
        message.channel.send('No free code available, use second argument')
        return
    }
    let id = hex + '/' + code

	 let alike = Object.values(allColorData).find(e=>e.code==code);
 	 if (alike) {
        if (!alike.id.includes('/')) {
            message.channel.send(`can't override builtin color \`${ alike.id }\``)
            return 'halt'
        }
		 delete allColorData[alike.id];
		 if (customColors.includes(alike)) {
			 customColors.splice(customColors.indexOf(alike), 1)
		 };
	 }

	 registerCustomColor({ id, code, hex });
	 initColors();
	 message.channel.send(
		 `Added new color: { id: \`${id}\`, code: \`${code}\`, hex: \`${hex}\` }`,
		 imgShapeSingle(`C${code}`.repeat(4), true, false),
	 );
	 return
}


export const cmd_try_shape = {
    type: 'fn',
    id: 'try_shape',
    fname: 'try_shape',
    fn: try_shape,
    main: true,
}
function try_shape(message, data, args) {
	 if (!args || !args[0]) {
		 message.channel.send('Invalid try_shape form, use as  *try_shape(`svg_path`, `?color_code`)* , with `code` style for arguments')
		 return 'halt';
	 }

	 let svg = m[0];
	 let color = m[1] || 'u';
	 let draw = parseFloat(svg) ? svg.replace(parseFloat(svg), '') : svg
	 if (!new Path2D(draw).ops_.length) {
		  message.channel.send(`Colud not parse path`)
		 return 'halt';
	 }
	 if (customShapes.length >= 20) {
		 let del = customShapes.splice(6, 1)[0]
		 delete allShapeData[del.id]
	 }
	 let code = 'A';
	 while (Object.values(allShapeData).find(e=>e.code==code)) {
		 code = String.fromCharCode(code.charCodeAt(0) + 1)
	 }
	 let Z = Object.values(allShapeData).find(e=>e.code==code);
	 if (Z) {
		 if (customShapes.includes(Z)) {
			 customShapes.splice(customShapes.indexOf(Z), 1)
		 }
		 delete allShapeData[Z.id];
	 }
	 registerCustomShape({id:code, code:code, draw: svg, spawnColor: Object.values(allColorData).find(e=>e.code==color)?.id})
	 initShapes();

	 message.channel.send(
		 `Shape: { draw: \`${svg}\` }`,
		 imgShapeSingle(`${code}${color}`.repeat(4), true, false),
	 );
}

export const cmd_add_shape = {
    type: 'fn',
    id: 'add_shape',
    fname: 'add_shape',
    fn: add_shape,
    main: true,
}
function add_shape(message, data, args) {
        let svg = args[0]
        let color = args[1] || 'u';
        let draw = parseFloat(svg) ? svg.replace(parseFloat(svg), '') : svg
        if (!new Path2D(draw).ops_.length) {
             message.channel.send(`Colud not parse path`)
            return '';
        }
        if (customShapes.length > 20) {
            let del = customShapes.splice(6, 1)[0]
            delete allShapeData[del.id]
        }
        let code = 'A';
        while (Object.values(allShapeData).find(e=>e.code==code)) {
            code = String.fromCharCode(code.charCodeAt(0) + 1)
        }
        let Z = Object.values(allShapeData).find(e=>e.code==code);
        if (Z) {
            if (customShapes.includes(Z)) {
                customShapes.splice(customShapes.indexOf(Z), 1)
            }
            delete allShapeData[Z.id];
        }
        registerCustomShape({id:code, code:code, draw: svg, spawnColor: Object.values(allColorData).find(e=>e.code==color)?.id})
        initShapes();
        message.channel.send(
            `Shape: { draw: \`${svg}\` }`,
            imgShapeSingle(`${code}${color}`.repeat(4), true, false),
        );
}
// function addCustomShape(text, message) {
//	 if (!text.includes('add_shape')) return text;
//	 return text;
// //	 if (!message.content.includes('add_shape')) return false;

// //	 let m = message.console.match(/add_shape\(`()`\)/)
// }


export const cmd_clear_shapes = {
    type: 'fn',
    id: 'clear_shapes',
    fname: 'clear_shapes',
    fn: clear_shapes,
    main: true,
}
function clear_shapes(message, data, args) {}
// function clearShapes(text, message) {
// 	if (!text.includes('clear_shapes')) return text;
// 	text = text.replace(/clear_shapes/, '')
// 	customShapes.splice(6, 99);
// 	message.channel.send('Custom shapes were cleared');
// 	return text;
// }
