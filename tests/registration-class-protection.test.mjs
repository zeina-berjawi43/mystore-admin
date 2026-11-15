// Render and exercise the actual pricing screen with in-memory hooks and API mocks.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { test } from 'node:test';
import React from 'react';
import { transformWithOxc } from 'vite';

const nodes = (tree, predicate) => !tree || typeof tree !== 'object' ? [] : Array.isArray(tree)
  ? tree.flatMap(child => nodes(child, predicate)) : [...(predicate(tree) ? [tree] : []), ...nodes(tree.props?.children, predicate)];
const text = tree => typeof tree === 'string' ? tree : Array.isArray(tree) ? tree.map(text).join('') : tree && typeof tree === 'object' ? text(tree.props?.children) : '';
async function fixture(classes) {
  const source = readFileSync('src/pages/PricingSettings.jsx', 'utf8').replace(/^import.*;\s*$/gm, '')
    .replace('  return <div', '  globalThis.handlers={classes,setClasses,save,manage,message};\n  return <div');
  const { code } = await transformWithOxc(source.replace('export default function', 'function') + '\nglobalThis.Screen=PricingSettings;', 'Pricing.jsx', { jsx: { runtime: 'classic' } });
  const slots = []; let cursor = 0, effect;
  const context = { React, useState: initial => { const i = cursor++; if (!(i in slots)) slots[i] = initial;
    return [slots[i], value => { slots[i] = typeof value === 'function' ? value(slots[i]) : value; }]; },
    useRef: initial => { const i = cursor++; return slots[i] ||= { current: initial }; },
    useEffect: fn => { effect ||= fn; }, getToken: () => 'fixture-only',
    api: { get: async () => ({ data: { classes, defaultClass: 'A' } }) } };
  vm.createContext(context); vm.runInContext(code, context);
  const render = () => { cursor = 0; const tree = context.Screen(); return { tree, ...context.handlers }; };
  render(); effect(); await new Promise(resolve => setImmediate(resolve));
  return { render, api: context.api };
}

test('protected names and Delete are locked without disabling financial settings or Set as Default', async () => {
  const classes = { A: { name: 'Other', adjustment: -3, minimum: 2000 }, B: { name: 'B-D', adjustment: 0, minimum: 250 },
    C: { name: 'C-D', adjustment: 20, minimum: 100, freeDeliveryThreshold: 150, deliveryFeeBelowThreshold: 5 } };
  const h = await fixture(classes), { tree } = h.render();
  const cards = nodes(tree, node => node.type === 'fieldset');
  for (const [index, key] of ['A', 'B', 'C'].entries()) {
    const card = cards[index], name = nodes(card, node => node.type === 'input' && node.props.maxLength === 80)[0];
    assert.equal(name.props.readOnly, key !== 'A');
    if (key === 'A') continue;
    assert.ok(text(card).includes('Registration class name is protected'));
    assert.equal(nodes(card, node => node.type === 'button' && text(node) === 'Delete class')[0].props.disabled, true);
    assert.equal(nodes(card, node => node.type === 'button' && text(node) === 'Set as Default')[0].props.disabled, false);
    assert.equal(card.props.disabled, false);
    const numbers = nodes(card, node => node.type === 'input' && node.props.type === 'number');
    assert.equal(numbers.length, key === 'C' ? 4 : 2);
    numbers.forEach(input => assert.ok(!input.props.disabled && !input.props.readOnly));
  }
  h.render().setClasses(previous => ({ ...previous, B: { ...previous.B, adjustment: '8', minimum: '75' },
    C: { ...previous.C, adjustment: '30', minimum: '60', freeDeliveryThreshold: '120', deliveryFeeBelowThreshold: '7' } }));
  let payload;
  h.api.put = async (_url, body) => { payload = body; return { data: { classes: body.classes } }; };
  await h.render().save({ preventDefault() {} });
  assert.equal(payload.classes.B.name, 'B-D'); assert.equal(payload.classes.C.name, 'C-D');
  assert.equal(payload.classes.B.adjustment, 8); assert.equal(payload.classes.B.minimum, 75);
  assert.equal(payload.classes.C.adjustment, 30); assert.equal(payload.classes.C.minimum, 60);
  assert.equal(payload.classes.C.freeDeliveryThreshold, 120); assert.equal(payload.classes.C.deliveryFeeBelowThreshold, 7);
});

test('server identities determine protection, ordinary draft names remain editable, and backend errors are displayed', async () => {
  const h = await fixture({ home17: { name: 'C-D', adjustment: 20, minimum: 100 }, shop8: { name: 'B-D', adjustment: 0, minimum: 250 },
    Extra: { name: 'Other', adjustment: 0, minimum: 10 } });
  let cards = nodes(h.render().tree, node => node.type === 'fieldset');
  assert.equal(nodes(cards[0], node => node.type === 'input')[0].props.readOnly, true);
  assert.equal(nodes(cards[1], node => node.type === 'input')[0].props.readOnly, true);
  h.render().setClasses(previous => ({ ...previous, Extra: { ...previous.Extra, name: 'C-D' } }));
  cards = nodes(h.render().tree, node => node.type === 'fieldset');
  assert.equal(nodes(cards[2], node => node.type === 'input')[0].props.readOnly, false);
  h.api.put = async () => { throw { response: { data: { message: 'Registration class name C-D is protected and cannot be assigned to another class.' } } }; };
  await h.render().save({ preventDefault() {} });
  assert.match(h.render().message, /Registration class name C-D is protected/);
});
