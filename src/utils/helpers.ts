import browser from 'webextension-polyfill';

/**
 * Checks if the extension is Manifest V3
 */
export function isManifestV3(){
    return browser.runtime.getManifest().manifest_version === 3;
}

/**
 * Returns a shortened string
 */
export function getShortString(query: string, maxChars = 30){
    // Do nothing if query doesn't need to be shortened
    if(query.length < maxChars) return query;

    const halfMax = maxChars / 2;
    const halfLength = query.length / 2;
    // Keep string length number of maxChars or less
    const clampLength = halfLength <= halfMax ? halfLength : halfMax;
    const firstChars = query.substring(0, clampLength);
    const lastChars = query.substring(query.length - clampLength, query.length);
    return `${firstChars}...${lastChars}`;
}