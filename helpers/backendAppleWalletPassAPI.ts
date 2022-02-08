const { Template } = require("@walletpass/pass-js");
const im = require('imagemagick');
import path from 'path'
import fs from 'fs'
import { NFT, NFTMetaData } from '../@types/types'
import { normaliseURL } from './urlAPI';

const getResizePromise = (
  image: any,
  filepath: string
  ) => {
  return new Promise((resolve) => {
      setTimeout(() => {
        im.resize({
          srcData: image,
          format: 'png',
          height: 144
        }, (err: any, stdout: any, stderr: any) => {
          fs.writeFileSync(filepath, stdout, 'binary');
          resolve(true)
        })
      }, 60);
  });
}

export async function generatePass(
  nft: NFT,
  appBaseURL: string,
  walletAddress: string
): Promise<any> {
  // FIXME: Don't store the cert in the repo in the final product ;P 
  const dir = path.resolve('./resources');

  let nftName = nft.name
  let nftDescription = ""
  let image: any | undefined = undefined
  if (nft?.token_uri) {
    const response = await fetch(nft.token_uri, {method: 'GET'})
    const nftMetaData = await response.json()
    nftName = nftMetaData.name
    nftDescription = nftMetaData.description
    const imageURL = nftMetaData.image_url || nftMetaData.image
    console.log("IMAGE URL: " + imageURL)
    if (imageURL) {
      const response = await fetch(normaliseURL(imageURL));
      const arrayBuffer = await response.arrayBuffer();
      image = Buffer.from(arrayBuffer);
    }
  }

  const template = new Template("coupon", {
    passTypeIdentifier: "pass.me.arturwdowiarski.first-pass",
    teamIdentifier: "Y23Q74DCEK",
    organizationName : "NFT 2 Wallet",
    logoText: "NFT 2 Wallet",
    foregroundColor : "rgb(203, 213, 225)",
    backgroundColor : "rgb(39, 45, 115)",
    labelColor: "rgb(253, 186, 116)",
    description: "NFT 2 Wallet Pass",
    sharingProhibited: true,
    coupon: {
      secondaryFields : [
        {
          "key" : "name",
          "value" : nftName
        },
        {
          "key" : "description",
          "label" : "INFO",
          "value" : nftDescription
        }
      ]
    }
  });
  const verificationURL = appBaseURL + "/verify/" + nft.token_address + "?walletAddress=" + walletAddress + "&tokenId=" + nft.token_id
  console.log("VERIFICATION URL = " + verificationURL)
  template.barcodes = [
    {
    "message" : verificationURL,
    "format" : "PKBarcodeFormatQR",
    "messageEncoding" : "iso-8859-1"
    }
  ]
  await template.images.add("icon", "./resources/passes/NFT.pass/icon.png")
  await template.images.add("logo", "./resources/passes/NFT.pass/logo.png")
  const filepath = "./resources/" + nft.token_address + ":" + nft.token_id + ".png"
  if (image) {
    if (!fs.existsSync(filepath)) {
      const thumbnail = await getResizePromise(
        image,
        filepath
      )
    }
    await template.images.add("strip", filepath)
  }

  await template.loadCertificate("./resources/cert/NFT2WalletSignerCert.pem", "nft2wallet");
  template.serialNumber = nft.token_address

  const pass = template.createPass();
  return pass
}
  
export  {};
