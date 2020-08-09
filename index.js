console.clear();
var {Client, MessageAttachment} = require('discord.js');
import('./shape.mjs').then(md => {
    _md = md;
    Object.assign(globalThis, md);
    // console.log(_md)
})

isDev = process.argv.includes('-dev')
console.log({isDev})
var Canvas = require('canvas');
require('./shapes/canvas-polyfill-fixed.js');
client = new Client();

client.on('message', message=>{

    // if (message.content == 'destroy shapebot') {
    //     client.destroy();
    // } 
    try{
    _m = message
    if (!isDev && (message.channel.name == 'bot-dev' || message.content.includes('_dev'))) return;
    if (isDev && message.channel.name != 'bot-dev' && !message.content.includes('_dev')) return;
    console.log({guild:message.guild.name,channel:message.channel.name, content:message.content})
    if (message.guild.id != '728969392569712670' && message.channel.name.includes('shapebot') && !message.content.includes('shapebot')) return;
    console.log({guild:message.guild.name,channel:message.channel.name, content:message.content})
    if (message.author.bot) return;

    if (message.content.includes('https') || message.content.includes(':eval')) return;

    if (message.content.match(/(^|\s)help($|\s)/) && message.content.includes('shapebot')) {
        return show_help(message);
    }

    let text = message.content;

    function apply(fn) {
        let prev = text;
        text = fn(text, message);
        if (typeof text != 'string') {
            console.error(fn, 'returned non-string value')
            throw fn
        }
        if (text != prev) apply(fn);
    }

    apply(clearShapes)
    apply(addCustomColor)
    apply(addCustomShape)
    apply(tryShape)

    if (text.match(/\ball_shapes\b/)) {
        let all_shapes = ` ${Object.values(allShapeData).map(e=>e.code).join(': ')}: `
        text = text.replace(/\ball_shapes\b/, all_shapes)
    }
    
    if (text.match(/\ball_colors\b/)) {
        let all_colors = ` C${Object.values(allColorData).map(e=>e.code == '-' ? '-C-C-C-' : e.code).join(': C')}: `
        text = text.replace(/\ball_colors\b/, all_colors)
    }
    
    let m = text.match(/:?([a-zA-Z\-]*:)([a-zA-Z\-]*:?)*:?|([A-Z][a-z]|--){4}/g)
    if (m && m.length == 1) {
        let typeKey = !text.includes('no_key')
        let typeErr = !text.includes('no_err')
        let attachment = attachShapeSingle(m[0], typeKey, typeErr);
        message.channel.send(attachment)
    } 
    if (m && m.length > 1) {
        let typeKey = !text.includes('no_key')
        let typeErr = !text.includes('no_err')
        let attachment = attachShapeMultiple([...m], typeKey, typeErr)
        message.channel.send(attachment)
    }


    }catch(err){console.error(err)}
}
);

function show_help(message) {
    message.channel.send(`
**# Help:**
   - \`[shape with :'s]\` - display shape
   - \`[shape] [shape]\`  - display multiple shapes
   - \`all_shapes\` - display all shapes
   - \`all_colors\` - display all colors
   - \`add_color( [css_ color] , [?code] )\` - add color
   - \`try_shape( [svg_path] )\` - add shape
\`\`\``)
}



attachShapeSingle = function attachShapeSingle(key, typeKey, typeErr) {
    cv = Canvas.createCanvas(100, typeKey ? 120 : 100)
    ctx = cv.getContext('2d')

    ctx.save()
    errs = drawShape(key, cv, ctx, 100);
    ctx.restore()
    ctx.font = 'bold 16px "Courier New"'
    ctx.fillStyle = 'red'
    ctx.textAlign = 'start'
    ctx.textBaseline = 'top'
    if (errs && errs[0] && typeErr) {
        ctx.fillText(errs[0].message.replace(/<[^>]*>/g,''), 0, 0, 100)
    }
    ctx.fillStyle = 'white'
    ctx.textAlign = 'end'
    ctx.textBaseline = 'bottom'
    if (typeKey)
        ctx.fillText(key, 100, 120, 100)

    console.log(key)
    return new MessageAttachment(cv.toBuffer(), `shape-${key}.png`)
}

function attachShapeMultiple(keys, typeKey, typeErr) {
    cv = Canvas.createCanvas(100 * keys.length, typeKey ? 120 : 100)
    ctx = cv.getContext('2d')

    for (let key of keys) {
        ctx.save()
        errs = drawShape(key, cv, ctx, 100);
        ctx.restore()
        ctx.font = 'bold 16px "Courier New"'
        ctx.fillStyle = 'red'
        ctx.textAlign = 'start'
        ctx.textBaseline = 'top'
        if (errs && errs[0] && typeErr) {
            ctx.fillText(errs[0].message.replace(/<[^>]*>/g,''), 0, 0, 100)
        }
        ctx.fillStyle = 'white'
        ctx.textAlign = 'end'
        ctx.textBaseline = 'bottom'
        if (typeKey)
            ctx.fillText(key, 100, 120, 100)
        ctx.translate(100, 0)
    }
    console.log(keys)
    return new MessageAttachment(cv.toBuffer(), `shape-${keys}.png`)
}

function addCustomColor(text, message) {
    if (!text.includes('add_color')) return text;
    let m = text.match(/add_color\(\s*`([^`]+)`\s*(?:,|(?=\)))\s*(?:`([^`]+)`\s*(?:,|(?=\)))\s*)?\s*(?:`([^`]+)`\s*(?:,|(?=\)))\s*)?\)/)
    if (!m) {
        message.channel.send('Invalid add_color form, use as  *add_color(`color`, `?symbol`, `?name`)* , with `code` style for arguments')
        return '';
    }
    text = text.slice(0, m.index) + text.slice(m.index + m[0].length)
    console.log(text, ...m)
    let hex = m[1];
    let code = m[2] || m[1][0];
    let id = m[3] || m[1];

    let same = allColorData[id];
    if (same) {
        delete allColorData[same.id];
        if (customColors.includes(same)) {
            customColors.splice(customColors.indexOf(same), 1)
        };
    }
    
    let alike = Object.values(allColorData).find(e=>e.code==code);
    if (alike) {
        if (!text.includes('override')) {
            message.channel.send(`Error: code \`${alike.code}\` already exists on color \`${alike.id}\``)
            return '';
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
        attachShapeSingle(`C${code}`.repeat(4), true),
    );
    return text;

}

function tryShape(text, message) {
    if (!text.includes('try_shape')) return text;
    let m = text.match(/try_shape\(\s*`([^`]+)`\s*(?:,|(?=\)))\s*(?:`([^`]+)`\s*(?:,|(?=\)))\s*)?\)/)
    if (!m) {
        message.channel.send('Invalid try_shape form, use as  *try_shape(`svg_path`, `?color_code`)* , with `code` style for arguments')
        return '';
    }
    text = text.slice(0, m.index) + text.slice(m.index + m[0].length)
    console.log(text, ...m)
    let svg = m[1];
    let color = m[2] || 'u';
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
        attachShapeSingle(`${code}${color}`.repeat(4), true),
    );

    return text;
}

function addCustomShape(text, message) {
    if (!text.includes('add_shape')) return text;
    return text;
//     if (!message.content.includes('add_shape')) return false;

//     let m = message.console.match(/add_shape\(`()`\)/)
}


function clearShapes(text, message) {
	if (!text.includes('clear_shapes')) return text;
	text = text.replace(/clear_shapes/, '')
	customShapes.splice(6, 99);
	message.channel.send('Custom shapes were cleared');
	return text;
}


// // Extract the required classes from the discord.js module
// const { Client, MessageAttachment, Attachment } = require('discord.js');

// // Create an instance of a Discord client
// const client = new Client();

// /**
//  * The ready event is vital, it means that only _after_ this will your bot start reacting to information
//  * received from Discord
//  */

// client.on('message', message => {
//   // If the message is '!rip'
//   if (message.content === '!rip') {
//     // Create the attachment using MessageAttachment
//     const attachment = new Attachment('https://i.imgur.com/w3duR07.png');
//     // Send the attachment in the message channel with a content
//     message.channel.send(`${message.author},`, attachment);
//   }
// });

client.on('ready', ()=>{
    console.log('I am ready!');
}
);
// Log our bot in using the token from https://discordapp.com/developers/applications/me
client.login(process.env.BOT_TOKEN)
