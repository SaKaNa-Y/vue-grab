import pc from 'picocolors'

interface InitOptions {
  yes?: boolean
}

export async function initProject(_options: InitOptions = {}) {
  console.log(pc.cyan('vue-grab') + ' — Initializing...')
  // TODO: Detect framework, install @sakana/vue-grab, add plugin setup
  console.log(pc.green('Done!'))
}
