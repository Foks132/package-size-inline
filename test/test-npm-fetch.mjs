// Тест запросов к npm registry без VS Code
const NPM_REGISTRY = 'https://registry.npmjs.org';

async function fetchSize(packageSpec) {
  const at = packageSpec.indexOf('@', 1);
  const name = at === -1 ? packageSpec : packageSpec.slice(0, at);
  const version = at === -1 ? '*' : packageSpec.slice(at + 1) || '*';
  if (!name) return '—';

  const encodedName = encodeURIComponent(name);
  const useExact = version && version !== '*' && /^\d+\.\d+\.\d+(-[^+]+)?(\+.*)?$/.test(version);

  try {
    if (useExact) {
      const url = `${NPM_REGISTRY}/${encodedName}/${encodeURIComponent(version)}`;
      console.log('GET', url);
      const res = await fetch(url);
      console.log('  status', res.status);
      if (!res.ok) return '—';
      const data = await res.json();
      const bytes = data?.dist?.unpackedSize;
      if (bytes == null) return '—';
      return (bytes / 1024).toFixed(1) + ' kB';
    }

    const url = `${NPM_REGISTRY}/${encodedName}`;
    console.log('GET', url);
    const res = await fetch(url);
    console.log('  status', res.status);
    if (!res.ok) return '—';
    const data = await res.json();
    const versions = data.versions;
    if (!versions) return '—';
    const versionToUse = !version || version === '*' ? data['dist-tags']?.latest : version;
    const ver = versions[versionToUse] || versions[data['dist-tags']?.latest];
    const bytes = ver?.dist?.unpackedSize;
    if (bytes == null) return '—';
    return (bytes / 1024).toFixed(1) + ' kB';
  } catch (e) {
    console.error(e);
    return '—';
  }
}

async function main() {
  console.log('Test 1: lodash (no version)');
  const s1 = await fetchSize('lodash');
  console.log('  size:', s1, '\n');

  console.log('Test 2: lodash@4.17.21 (exact)');
  const s2 = await fetchSize('lodash@4.17.21');
  console.log('  size:', s2, '\n');

  console.log('Test 3: @babel/core (scoped)');
  const s3 = await fetchSize('@babel/core');
  console.log('  size:', s3, '\n');

  console.log('Test 4: invalid package');
  const s4 = await fetchSize('this-package-does-not-exist-xyz-123');
  console.log('  size:', s4);
}

main();
