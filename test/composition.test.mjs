// Composition test: the bundle patch is a valid loader patch that inserts the
// package by NAME (never a source path), and the package entry exposes exactly
// the plugin face the loader consumes.

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import * as plugin from '../index.js'

const PATCH_URL = new URL('../cordis.patch.yml', import.meta.url)
const PACKAGE_URL = new URL('../package.json', import.meta.url)

async function readPatch() {
  return readFile(fileURLToPath(PATCH_URL), 'utf8')
}

test('patch file exists and is a non-empty YAML array', async () => {
  const patch = await readPatch()
  assert.ok(patch.includes('- insert:'))
})

test('patch inserts exactly one row, by package name, with the expected id', async () => {
  const patch = await readPatch()
  assert.equal(patch.split('- insert:').length - 1, 1)
  assert.ok(patch.includes('id: method-principles'))
  assert.ok(patch.includes('name: dsh-method-principles'))
  assert.equal(patch.includes('file:'), false)
  assert.equal(patch.includes('link:'), false)
  assert.equal(patch.includes('.js'), false)
})

test('package manifest declares the bundle patch and the module entry', async () => {
  const manifest = JSON.parse(await readFile(fileURLToPath(PACKAGE_URL), 'utf8'))
  assert.equal(manifest.name, 'dsh-method-principles')
  assert.equal(manifest.dsh.bundle.patch, './cordis.patch.yml')
  assert.equal(manifest.main, 'index.js')
  assert.equal(manifest.type, 'module')
  assert.ok(manifest.files.includes('cordis.patch.yml'))
  assert.ok(manifest.files.includes('src/'))
  assert.equal(manifest.dsh.client, undefined)
})

test('plugin entry exposes the loader face, section constants and routing helpers', () => {
  assert.deepEqual(Object.keys(plugin).sort(), [
    'Config',
    'DEFAULT_PRINCIPLES_TEXT',
    'SECTION_NAME',
    'SECTION_ORDER',
    'apply',
    'depthOf',
    'inject',
    'name',
    'resolveRouteText',
    'routeMatches',
  ])
  assert.equal(plugin.name, 'dsh-method-principles')
  assert.deepEqual(plugin.inject, ['systemPrompt', 'agentPresets'])
  assert.equal(typeof plugin.apply, 'function')
})

test('package name equals plugin name equals patch row name', async () => {
  const manifest = JSON.parse(await readFile(fileURLToPath(PACKAGE_URL), 'utf8'))
  assert.equal(manifest.name, plugin.name)
})
