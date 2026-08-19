import { BlueprintDetailData, ModInfo } from '../types';

export const parseXmlDetail = (xmlString: string): BlueprintDetailData => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlString, 'text/xml');

  const parserError = doc.querySelector('parsererror');
  if (parserError) {
    throw new Error('XML parsing failed');
  }

  const extraInfo = doc.querySelector('extraInfo');
  
  let description = '';
  let mods: ModInfo[] = [];
  let referenceUrl = '';
  let referenceUrlName = '';

  if (extraInfo) {
    const descNode = extraInfo.querySelector('description');
    if (descNode && descNode.textContent) {
      description = descNode.textContent.trim();
    }

    const modNodes = extraInfo.querySelectorAll('modPackages mod');
    modNodes.forEach(node => {
      const packageIdNode = node.querySelector('packageId');
      const nameNode = node.querySelector('name');
      
      if (packageIdNode && packageIdNode.textContent) {
        mods.push({
          packageId: packageIdNode.textContent.trim(),
          name: nameNode?.textContent?.trim() || packageIdNode.textContent.trim()
        });
      }
    });

    const urlNode = extraInfo.querySelector('url');
    if (urlNode && urlNode.textContent) {
      referenceUrl = urlNode.textContent.trim();
      referenceUrlName = urlNode.getAttribute('name') || urlNode.getAttribute('Name') || referenceUrl;
    }
  }

  return {
    description,
    mods,
    referenceUrl,
    referenceUrlName,
    rawXml: xmlString
  };
};