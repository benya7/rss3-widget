import axios from 'axios';

export default async function getTypeOfMedia(url: string) {
  const urlParsed = url.startsWith('ipfs://') ? `https://ipfs.io/ipfs/${url.split('//')[1]}` : url;
  const {headers} = await axios.get(urlParsed);
  return headers['content-type'].split('/')[0];
}