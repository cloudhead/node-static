import {readFileSync} from 'fs';

const pkg = JSON.parse(
    // @ts-expect-error Works fine
    readFileSync(new URL('../package.json', import.meta.url))
);

const optionDefinitions = [
    {
        name: 'directory', alias: 'd', type: String, defaultOption: true,
        description: 'A specific directory in which to serve files. Optional.',
        typeLabel: '{underline filepath}'
    },
    {
        name: 'port', alias: 'p', type: Number,
        description: 'TCP port at which the files will be served. ' +
            '[default: 8080]',
        typeLabel: '{underline PORT}'
    },
    {
        name: 'host-address', alias: 'a', type: String,
        description: 'The local network interface at which to listen. ' +
            '[default: "127.0.0.1"]',
        typeLabel: '{underline ADDRESS}'
    },
    {
        name: 'cache', alias: 'c', type: JSON.parse,
        description: '"Cache-Control" header setting. [default: 3600]',
        typeLabel: '{underline SECONDS}'
    },
    {
        name: 'default-extension', alias: 'e', type: String,
        description: 'Optional default extension',
        typeLabel: '{underline extension name}'
    },
    {
        name: 'server-info', type: String,
        description: 'Info to indicate in a header about the server',
        typeLabel: '{underline server info}'
    },
    {
        name: 'serve-hidden', type: Boolean,
        description: 'Whether to serve hidden files. Defaults to `false`.',
    },
    {
        name: 'headers', alias: 'H', type: String,
        description: 'Additional headers in JSON format.',
        typeLabel: '{underline HEADERS}'
    },
    {
        name: 'header-file', alias: 'f', type: String,
        description: 'JSON file of additional headers.',
        typeLabel: '{underline FILE}'
    },
    {
        name: 'gzip', alias: 'z', type: Boolean,
        description: 'Enable compression (tries to serve file of same name ' +
            'plus ".gz"). Optional.'
    },
    {
        name: 'gzip-only', type: String,
        description: 'Allows or requires compression. Optional.',
        typeLabel: '{underline "allow"|"require"}'
    },
    {
        name: 'spa', type: Boolean,
        description: 'Serve the content as a single page app by redirecting ' +
            'all non-file requests to the index HTML file. Optional.'
    },
    {
        name: 'index-file', alias: 'i', type: String,
        description: 'Specify a custom index file when serving up ' +
            'directories. [default: "index.html"]',
        typeLabel: '{underline FILENAME}'
    }
];

const cliSections = [
    {
        // Add italics: `{italic textToItalicize}`
        content: 'Node-Static CLI - ' + pkg.description +
            '\n\nUSAGE: {italic static [OPTIONS] [-p PORT] [<directory>]}'
    },
    {
        optionList: optionDefinitions
    }
];

export {optionDefinitions as definitions, cliSections as sections};
