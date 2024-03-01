import browser from 'webextension-polyfill';

export function isManifestV3(){
    return browser.runtime.getManifest().manifest_version === 3;
}