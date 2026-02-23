const fs = require('fs')
const path = require('path')

function shouldIgnoreFile(filename) {
  return filename === 'index.ts' || filename.startsWith('.') || filename.endsWith('.spec.ts')
}

function shouldIgnoreDirectory(dirName) {
  return dirName === 'mock'
}

// Libs to skip entirely (e.g., database has generated Prisma files)
const IGNORED_LIBS = ['database']

function hasOnlyIndexFile(dirPath) {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true })
  return entries.length === 1 && entries[0].name === 'index.ts'
}

function generateIndexContent(files, dirPath, isRoot = false) {
  let exports = files
    .map((file) => {
      const filename = path.basename(file, path.extname(file))
      if (isRoot && filename !== 'index') {
        return `export * from './${filename}'`
      }
      return `export * from './${filename}'`
    })
    .join('\n')

  // Get subdirectories
  const entries = fs.readdirSync(dirPath, { withFileTypes: true })
  const subdirectories = entries
    .filter((entry) => entry.isDirectory())
    .filter((dir) => !shouldIgnoreDirectory(dir.name))
    .filter((dir) => !hasOnlyIndexFile(path.join(dirPath, dir.name)))

  const subDirExports = subdirectories.map((dir) => `export * from './${dir.name}'`).join('\n')

  if (exports && subDirExports) {
    exports += '\n' + subDirExports
  } else if (subDirExports) {
    exports = subDirExports
  }

  return exports ? exports + '\n' : ''
}

function deleteIndexFiles(dirPath, isRoot = false) {
  if (isRoot) {
    const indexPath = path.join(dirPath, 'index.ts')
    if (fs.existsSync(indexPath)) {
      fs.unlinkSync(indexPath)
      console.log(`Deleted ${indexPath}`)
    }
    return
  }

  const indexPath = path.join(dirPath, 'index.ts')
  if (fs.existsSync(indexPath)) {
    fs.unlinkSync(indexPath)
  }

  const entries = fs.readdirSync(dirPath, { withFileTypes: true })
  entries
    .filter((entry) => entry.isDirectory())
    .forEach((dir) => {
      deleteIndexFiles(path.join(dirPath, dir.name))
    })
}

function processModule(dirPath, isAppRoot = false) {
  if (isAppRoot) {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true })
    const subdirectories = entries.filter((entry) => entry.isDirectory() && !shouldIgnoreDirectory(entry.name))

    subdirectories.forEach((dir) => {
      const subdirPath = path.join(dirPath, dir.name)
      processModule(subdirPath, false)
    })
    return
  }

  const entries = fs.readdirSync(dirPath, { withFileTypes: true })

  const jsFiles = entries
    .filter((entry) => entry.isFile() && entry.name.endsWith('.ts') && !shouldIgnoreFile(entry.name))
    .map((entry) => path.join(dirPath, entry.name))

  if (jsFiles.length > 0 || !hasOnlyIndexFile(dirPath)) {
    const content = generateIndexContent(jsFiles, dirPath, path.basename(dirPath) === 'src')
    if (content) {
      fs.writeFileSync(path.join(dirPath, 'index.ts'), content)
    }
  }

  // Process subdirectories with the updated filter
  entries
    .filter((entry) => entry.isDirectory() && !shouldIgnoreDirectory(entry.name))
    .forEach((dir) => {
      const subdirPath = path.join(dirPath, dir.name)
      processModule(subdirPath, false)
    })
}

function generateLibsIndexes() {
  const currentDir = process.cwd()
  const libsDir = path.join(currentDir, 'libs')

  if (!fs.existsSync(libsDir)) {
    console.warn(`Directory ${libsDir} does not exist!`)
    return
  }

  const libModules = fs
    .readdirSync(libsDir, { withFileTypes: true })
    .filter((dirent) => dirent.isDirectory() && !shouldIgnoreDirectory(dirent.name))
    .filter((dirent) => !IGNORED_LIBS.includes(dirent.name))
    .map((dirent) => dirent.name)

  libModules.forEach((moduleName) => {
    const srcPath = path.join(libsDir, moduleName, 'src')
    if (fs.existsSync(srcPath)) {
      console.log(`\nProcessing libs module: ${moduleName}`)
      console.log('Cleaning up old index files...')
      deleteIndexFiles(srcPath)
      console.log('Generating new index files...')
      processModule(srcPath, false)
    } else {
      console.warn(`Warning: src directory not found in ${moduleName}`)
    }
  })
}

function generateAppsIndexes(appName) {
  const currentDir = process.cwd()
  const appsDir = path.join(currentDir, 'apps')

  if (!fs.existsSync(appsDir)) {
    console.warn(`Directory ${appsDir} does not exist!`)
    return
  }

  let appModules

  if (appName) {
    if (fs.existsSync(path.join(appsDir, appName))) {
      appModules = [appName]
    } else {
      console.error(`App "${appName}" not found in apps directory!`)
      return
    }
  } else {
    appModules = fs
      .readdirSync(appsDir, { withFileTypes: true })
      .filter((dirent) => dirent.isDirectory())
      .map((dirent) => dirent.name)
  }

  appModules.forEach((moduleName) => {
    const srcPath = path.join(appsDir, moduleName, 'src')
    if (fs.existsSync(srcPath)) {
      console.log(`\nProcessing apps module: ${moduleName}`)
      console.log('Cleaning up old index files...')
      deleteIndexFiles(srcPath, true)
      console.log('Generating new index files in subdirectories...')
      processModule(srcPath, true)
    } else {
      console.warn(`Warning: src directory not found in ${moduleName}`)
    }
  })
}

try {
  generateLibsIndexes()
  generateAppsIndexes(process.argv[2])
  console.log('\nSuccessfully regenerated all index.ts files!')
} catch (error) {
  console.error('Error generating index files:', error)
  process.exit(1)
}
