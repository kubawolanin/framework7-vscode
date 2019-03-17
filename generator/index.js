const fs = require('fs');
const { promisify } = require('util');
const readFile = promisify(fs.readFile);
const readdir = promisify(fs.readdir);

const frameworks = ['vue', 'react'];

const componentsPath = framework => `./framework7/src/pug/${framework}/`;
const exclusions = [
    'app-layout.pug',
    'colors.pug',
    'introduction.pug',
    'navigation-router.pug',
    'package.pug',
    'icon.pug',
    'index.pug',
    'init-app.pug',
    'installation.pug',
    'kitchen-sink.pug',
    'statusbar.pug',
    'vue-component-extensions.pug',
    'react-component-extensions.pug'
];

async function getComponents(framework) {
    let components;

    try {
        components = await readdir(componentsPath(framework));
    } catch (e) {
        return console.error('e', e);
    }

    if (components === undefined) {
        return console.error('No components found! Make sure to run ./setup first.');
    }

    return components
        .filter(comp => !exclusions.includes(comp));
}

async function getSnippets(component, framework) {
    try {
        const source = await readFile(`${componentsPath(framework)}${component}`, 'utf8');
        component = component.split('.pug')[0];

        const section = source
            .substr(source.indexOf('Examples') + 8, source.length)
            .trim();

        const examples = section
            .split('h4')
            .map(t => t.trim())
            .filter(n => n);

        const componentSnippets = examples.map(example => {
            const parts = example
                .split('\n')
                .map(p => p.replace(/\r/g, ''));

            const description = parts.shift();

            return {
                prefix: `f7:${component}`,
                description: description.startsWith(':code') ?
                    '' : description,
                body: parts
                    .filter(n => !n.trim().startsWith(':code'))
                    .map(l =>
                        l.replace(' '.repeat(12), '')
                        .replace(' '.repeat(10), '')
                    )
            }
        });

        return componentSnippets;
    } catch (err) {
        console.error(err);
    }
}

(async() => {
    for (framework of frameworks) {
        const snippets = {};
        const components = await getComponents(framework);
        for (component of components) {
            snippets[component.split('.pug')[0]] = await getSnippets(component, framework);
        };

        await fs.writeFile(`../snippets/${framework}.json`, JSON.stringify(snippets, null, 4), err => console.error(err));
        console.log(snippets);
    }
})();

const getDocs = (component, framework) =>
    `<a href="https://framework7.io/${framework}/${component}.html">${component} Documentation</a>`;

const getUrl = component =>
    `https://raw.githubusercontent.com/framework7io/framework7-website/master/src/pug/${framework}/${component}.pug`;