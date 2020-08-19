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

const rg_shape = /:?([a-zA-Z\-]*:)([a-zA-Z\-]*:?)*:?|([A-Z][a-z]|--){4}/g

export const cmd_any_shape = {
    type: 'always',
    id: 'any_shape',
    main: true,
    fn(message, data) {
        let no_err = tryReplace(data, /no_err|!/i)
        let no_key = tryReplace(data, /no_key|!/i)
        let as_rows = tryReplace(data, /as_rows|!/i)

        let d = parseArgs(data.s, 'size')
        data.s = d.s
        let size = d.args ? +d.args[0] : 100

        let allShapesRaw = data.s.match(/:?([a-zA-Z\-]*:)([a-zA-Z\-]*:?)*:?|([A-Z][a-z]|--){4}|\n/g)
        console.log({ s: data.s, allShapesRaw })
        if (!allShapesRaw || !allShapesRaw.find(e => e != '\n')) {
            return
        }
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




// function attachShapeMultiple(keys, typeKey, typeErr) {
//	 cv = Canvas.createCanvas(100 * keys.length, typeKey ? 120 : 100)
//	 ctx = cv.getContext('2d')

//	 for (let key of keys) {
//		 ctx.save()
//		 errs = drawShape(key, cv, ctx, 100);
//		 ctx.restore()
//		 ctx.font = 'bold 16px "Courier New"'
//		 ctx.fillStyle = 'red'
//		 ctx.textAlign = 'start'
//		 ctx.textBaseline = 'top'
//		 if (errs && errs[0] && typeErr) {
//			 ctx.fillText(errs[0].message.replace(/<[^>]*>/g,''), 0, 0, 100)
//		 }
//		 ctx.fillStyle = 'white'
//		 ctx.textAlign = 'end'
//		 ctx.textBaseline = 'bottom'
//		 if (typeKey)
//			 ctx.fillText(key, 100, 120, 100)
//		 ctx.translate(100, 0)
//	 }
//	 console.log(keys)
//	 return new MessageAttachment(cv.toBuffer(), `shape-${keys}.png`)
// }

// function addCustomColor(text, message) {
//	 if (!text.includes('add_color')) return text;
//	 let m = text.match(/add_color\(\s*`([^`]+)`\s*(?:,|(?=\)))\s*(?:`([^`]+)`\s*(?:,|(?=\)))\s*)?\s*(?:`([^`]+)`\s*(?:,|(?=\)))\s*)?\)/)
//	 if (!m) {
//		 message.channel.send('Invalid add_color form, use as  *add_color(`color`, `?symbol`, `?name`)* , with `code` style for arguments')
//		 return '';
//	 }
//	 text = text.slice(0, m.index) + text.slice(m.index + m[0].length)
//	 console.log(text, ...m)
//	 let hex = m[1];
//	 let code = m[2] || m[1][0];
//	 let id = m[3] || m[1];

//	 let same = allColorData[id];
//	 if (same) {
//		 delete allColorData[same.id];
//		 if (customColors.includes(same)) {
//			 customColors.splice(customColors.indexOf(same), 1)
//		 };
//	 }

//	 let alike = Object.values(allColorData).find(e=>e.code==code);
//	 if (alike) {
//		 if (!text.includes('override')) {
//			 message.channel.send(`Error: code \`${alike.code}\` already exists on color \`${alike.id}\``)
//			 return '';
//		 }
//		 delete allColorData[alike.id];
//		 if (customColors.includes(alike)) {
//			 customColors.splice(customColors.indexOf(alike), 1)
//		 };
//	 }

//	 registerCustomColor({ id, code, hex });
//	 initColors();
//	 message.channel.send(
//		 `Added new color: { id: \`${id}\`, code: \`${code}\`, hex: \`${hex}\` }`,
//		 attachShapeSingle(`C${code}`.repeat(4), true),
//	 );
//	 return text;

// }

// function tryShape(text, message) {
//	 if (!text.includes('try_shape')) return text;
//	 let m = text.match(/try_shape\(\s*`([^`]+)`\s*(?:,|(?=\)))\s*(?:`([^`]+)`\s*(?:,|(?=\)))\s*)?\)/)
//	 if (!m) {
//		 message.channel.send('Invalid try_shape form, use as  *try_shape(`svg_path`, `?color_code`)* , with `code` style for arguments')
//		 return '';
//	 }
//	 text = text.slice(0, m.index) + text.slice(m.index + m[0].length)
//	 console.log(text, ...m)
//	 let svg = m[1];
//	 let color = m[2] || 'u';
//	 let draw = parseFloat(svg) ? svg.replace(parseFloat(svg), '') : svg
//	 if (!new Path2D(draw).ops_.length) {
//		  message.channel.send(`Colud not parse path`)
//		 return '';
//	 }
//	 if (customShapes.length > 20) {
//		 let del = customShapes.splice(6, 1)[0]
//		 delete allShapeData[del.id]
//	 }

//	 let code = 'A';
//	 while (Object.values(allShapeData).find(e=>e.code==code)) {
//		 code = String.fromCharCode(code.charCodeAt(0) + 1)
//	 }

//	 let Z = Object.values(allShapeData).find(e=>e.code==code);
//	 if (Z) {
//		 if (customShapes.includes(Z)) {
//			 customShapes.splice(customShapes.indexOf(Z), 1)
//		 }
//		 delete allShapeData[Z.id];
//	 }
//	 registerCustomShape({id:code, code:code, draw: svg, spawnColor: Object.values(allColorData).find(e=>e.code==color)?.id})
//	 initShapes();

//	 message.channel.send(
//		 `Shape: { draw: \`${svg}\` }`,
//		 attachShapeSingle(`${code}${color}`.repeat(4), true),
//	 );

//	 return text;
// }

// function addCustomShape(text, message) {
//	 if (!text.includes('add_shape')) return text;
//	 return text;
// //	 if (!message.content.includes('add_shape')) return false;

// //	 let m = message.console.match(/add_shape\(`()`\)/)
// }


// function clearShapes(text, message) {
// 	if (!text.includes('clear_shapes')) return text;
// 	text = text.replace(/clear_shapes/, '')
// 	customShapes.splice(6, 99);
// 	message.channel.send('Custom shapes were cleared');
// 	return text;
// }
