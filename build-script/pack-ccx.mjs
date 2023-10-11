import chalk from 'chalk'
import { program } from 'commander'
import { createWriteStream, readFileSync, statSync, writeFileSync } from 'fs'
import { globSync } from 'glob'
import { dirname, join, relative } from 'path'
import { fileURLToPath } from 'url'
import yazl from 'yazl'

const __dirname = dirname(fileURLToPath(import.meta.url))
const basePath = join(__dirname, '..')

program.requiredOption('--version <platform>', 'the target platform').parse()

const version = program.opts().version
if (!version.match(/\d+\.\d+\.\d+/))
    throw new Error(`invalid version format: ${version}`)

console.log(chalk.cyan("rewriting manifest.json's version field to " + version))
const manifest = JSON.parse(readFileSync(`${basePath}/manifest.json`, 'utf-8'))
manifest.version = version
writeFileSync(`${basePath}/manifest.json`, JSON.stringify(manifest))

console.log(chalk.cyan("rewriting package.json's version field to " + version))
const packageJSON = JSON.parse(
    readFileSync(`${basePath}/package.json`, 'utf-8')
)
packageJSON.version = version
writeFileSync(`${basePath}/package.json`, JSON.stringify(packageJSON))

console.log(chalk.cyan('packaging .ccx'))
const zipList = [
    './manifest.json',
    './i18n/**/*',
    './icon/**/*',
    './jimp/**/*',
    './scripts/**/*',
    './typescripts/dist/**/*',
    './utility/**/*',
    './server/**/*',
    './*.js',
    './package.json',
    './tsconfig.json',
    './*.html',
    './*.py',
    './*.txt',
    './*.md',
    './*.png',
    './presets/**/*',
]

const zipfile = new yazl.ZipFile()

zipList.forEach((globber) => {
    globSync(join(basePath, globber).replace(/\\/g, '/')).forEach(
        (filepath) => {
            if (statSync(filepath).isDirectory()) return

            const rpath = relative(basePath, filepath)
            zipfile.addFile(filepath, rpath)
        }
    )
})

zipfile.outputStream.pipe(
    createWriteStream(
        join(basePath, `Auto.Photoshop.SD.plugin_v${version}.ccx`)
    )
)
zipfile.outputStream.pipe(
    createWriteStream(
        join(basePath, `Auto.Photoshop.SD.plugin_v${version}.zip`)
    )
)

zipfile.end()
