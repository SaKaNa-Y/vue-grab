#!/usr/bin/env node
import { cac } from 'cac'
import { initProject } from './commands/init'
import { version } from '../package.json'

const cli = cac('vue-grab')

cli
  .command('init', 'Initialize vue-grab in your project')
  .option('-y, --yes', 'Skip prompts and use defaults')
  .action(async (options) => {
    await initProject(options)
  })

cli.help()
cli.version(version)
cli.parse()
