console.clear();
var { Client, MessageAttachment } = require('discord.js');
import('./shape.mjs').then(md => {
    _md = md;
    Object.assign(globalThis, md);
    // console.log(_md)
})
fs = require('fs')

isDev = process.argv.includes('-dev')
console.log({ isDev })
var Canvas = require('canvas');
require('./shapes/canvas-polyfill-fixed.js');
client = new Client();


import('./commands.mjs').then(md => {
	client.on('message', md.onMessage);
})

client.on('message', message => {

    // if (message.content == 'destroy shapebot') {
    //     client.destroy();
    // } 
    try {
        _m = message
        // if (!isDev && (message.channel.name == 'bot-dev' || message.content.includes('_dev'))) return;
        // if (isDev && message.channel.name != 'bot-dev' && !message.content.includes('_dev')) return;
        // console.log({guild:message.guild.name,channel:message.channel.name, content:message.content})
        // if (message.guild.id != '728969392569712670' && !message.channel.name.includes('shapebot') && !message.content.match(/shapebot/i)) return;
        // console.log({guild:message.guild.name,channel:message.channel.name, content:message.content})
        // if (message.author.bot) return;

        // if (message.content.includes('https') || message.content.includes(':eval')) return;

        // if (message.content.match(/(^|\s)help($|\s)/) && message.content.match(/shapebot/i)) {
        //     return show_help(message);
        // }
        // if (message.content.match(/spam_link/) && message.content.match(/shapebot/i)) {
        //     return show_help(message);
        // }

        // let text = message.content;

        // function apply(fn) {
        //     let prev = text;
        //     text = fn(text, message);
        //     if (typeof text != 'string') {
        //         console.error(fn, 'returned non-string value')
        //         throw fn
        //     }
        //     if (text != prev) apply(fn);
        // }

        // apply(clearShapes)
        // apply(addCustomColor)
        // apply(addCustomShape)
        // apply(tryShape)

        // if (text.match(/\ball_shapes\b/)) {
        //     let all_shapes = ` ${Object.values(allShapeData).map(e=>e.code).join(': ')}: `
        //     text = text.replace(/\ball_shapes\b/, all_shapes)
        // }

        // if (text.match(/\ball_colors\b/)) {
        //     let all_colors = ` C${Object.values(allColorData).map(e=>e.code == '-' ? '-C-C-C-' : e.code).join(': C')}: `
        //     text = text.replace(/\ball_colors\b/, all_colors)
        // }

        // let m = text.match(/:?([a-zA-Z\-]*:)([a-zA-Z\-]*:?)*:?|([A-Z][a-z]|--){4}/g)
        // if (m && m.length == 1) {
        //     let typeKey = !text.includes('no_key')
        //     let typeErr = !text.includes('no_err')
        //     let attachment = attachShapeSingle(m[0], typeKey, typeErr);
        //     message.channel.send(attachment)
        // } 
        // if (m && m.length > 1) {
        //     let typeKey = !text.includes('no_key')
        //     let typeErr = !text.includes('no_err')
        //     let attachment = attachShapeMultiple([...m], typeKey, typeErr)
        //     message.channel.send(attachment)
        // }


    } catch (err) { console.error(err) }
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

client.on('ready', () => {
    console.log('I am ready!');
}
);
// Log our bot in using the token from https://discordapp.com/developers/applications/me
let token = process.env.BOT_TOKEN || fs.readFileSync('./node_modules/token.txt') + '';
client.login(token);











function initSay() {


    say = require('say');
    fs = require('fs')

    say.getInstalledVoices((er, v) => console.log(voices = v))
    voice = v => voices.find(e => e.toLowerCase().includes(v.toLowerCase()))

    client.on('message', m => onMessage(m))


    onMessage = function(message) {
        if (message.content.includes(':') || !message.content) return;

        if (!message.channel.name.includes('voice')) return;

        if (message.content.includes('all_voices')) {
            return all_voices(message);
        }

        if (message.content.includes('join_voice')) {
            return join_voice(message);
        }

        if (message.content.startsWith('say ') || message.content.startsWith('tts ')) {
            return sayText(message.cleanContent.slice(4), message);
        }

    }

    function all_voices(message) {
        console.log('all_voices');
        say.getInstalledVoices((er, v) => message.channel.send(v.map(e => `\`${e}\``).join('\n')));
    }

    let voice_connection = null;

    async function join_voice(message) {
        console.log('join_voice');
        if (!message.member.voice.channel) {
            message.channel.send('You are not in voice channel!');
            return;
        }
        voice_connection = await message.member.voice.channel.join();
        console.log(voice_connection);
    }

    let say_index = 0;

    function sayText(text, message) {
        if (!voice_connection) {
            message.channel.send('I\'m not in a voice channell!')
        }

        let own_index = say_index++;

        say.export(text, voice("david"), 1, `./wav/text_${own_index}.wav`, () => {
            let s = fs.createReadStream(`./wav/text_${own_index}.wav`);
            voice_connection.play(s);
        })
    }




    // vcn = _m.member.voice.channel
    // vcn.join().then(r=>cn = r).then(console.log)

}