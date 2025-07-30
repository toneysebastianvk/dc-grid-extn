import { init } from 'dc-extensions-sdk';

let sdk;

export async function getSdk() {
  if (sdk == null) {
    sdk = init();
  }
  return await sdk;
}