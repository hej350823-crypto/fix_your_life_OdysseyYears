import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const FLCLASH_CONFIG = path.join(
  os.homedir(),
  'Library/Application Support/com.follow.clash/config.yaml',
);

const FAKE_IP_ENTRIES = [
  '"*.volces.com"',
  '"*.volcengine.com"',
  '"deepseek.com"',
  '"*.deepseek.com"',
];

const DIRECT_RULES = [
  '"DOMAIN-SUFFIX,volces.com,DIRECT"',
  '"DOMAIN-SUFFIX,volcengine.com,DIRECT"',
];

const patchFlClashConfig = () => {
  if (!readFileSync) {
    return { patched: false, reason: 'missing fs' };
  }

  let config;
  try {
    config = readFileSync(FLCLASH_CONFIG, 'utf8');
  } catch {
    return { patched: false, reason: 'FlClash config not found' };
  }

  let next = config;
  let changed = false;

  for (const entry of FAKE_IP_ENTRIES) {
    if (!next.includes(entry)) {
      next = next.replace(
        '  fake-ip-filter-mode: "blacklist"',
        `    - ${entry}\n  fake-ip-filter-mode: "blacklist"`,
      );
      changed = true;
    }
  }

  for (const rule of DIRECT_RULES) {
    if (!next.includes(rule)) {
      next = next.replace(
        'rules:\n',
        `rules:\n  - ${rule}\n`,
      );
      changed = true;
    }
  }

  if (!changed) {
    return { patched: false, reason: 'already configured' };
  }

  writeFileSync(FLCLASH_CONFIG, next, 'utf8');
  return { patched: true, reason: 'updated fake-ip-filter and DIRECT rules' };
};

const reloadFlClash = () => {
  try {
    execFileSync('killall', ['-HUP', 'FlClashCore'], { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
};

const result = patchFlClashConfig();
if (result.patched) {
  const reloaded = reloadFlClash();
  console.log(`[fix-network] FlClash config updated${reloaded ? ' and reloaded' : ''}.`);
} else {
  console.log(`[fix-network] FlClash: ${result.reason}.`);
}

export default result;
