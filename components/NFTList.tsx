import React from 'react';
import styles from '../styles/Home.module.css'
import { Moralis }  from "moralis";
import { NFT, NFTMetaData } from "../@types/types"
import { sendCreatePassRequest } from '../helpers/APICalls';
import { normaliseURL } from '../helpers/urlAPI';
import { validateEmail } from '../helpers/emailAPI';

type Props = {
  absoluteURL: string
};

type State = {
  isLoadingNFTs: boolean,
  nfts: NFT[]
  nftsMetaData: { [token_address_and_id: string]: NFTMetaData }
};

export class NFTList extends React.Component<Props, State> {
  state: Readonly<State> = {
    isLoadingNFTs: true,
    nfts: [],
    nftsMetaData: {}
  }

  componentDidMount() {
    const chain: "polygon" | "eth" = "polygon"
    const walletAddress = Moralis.User.current()?.attributes.accounts[0] || ""
    const options = {
      chain: chain,
      address: walletAddress
    }
    Moralis.Web3API.account.getNFTs(options).then(results => {
      this.setState({
        ...this.state,
        isLoadingNFTs: false,
        nfts: results.result || []
      })
      results.result?.forEach(nft => {
        if (nft.token_uri) {
          fetch(nft.token_uri, {method: 'GET'})
          .then(response => {
            response.json().then((nftMetaData: NFTMetaData) => {
              const newNFTsMetaData = this.state.nftsMetaData;
              newNFTsMetaData[nft.token_address+":"+nft.token_id] = nftMetaData
                this.setState({
                  ...this.state,
                  nftsMetaData: newNFTsMetaData
                })
            })
          })
          .then(data => console.log(data))
          .catch(error => console.log(error));
        }
      });
    })
  }

  sendCreateCouponRequest(nft: NFT) {
    const walletAddress = Moralis.User.current()?.attributes.accounts[0] || ""
    const emailAddress = (document.getElementById('email-input') as HTMLInputElement).value
    if (validateEmail(emailAddress)) {
      const progressIndicator = document.getElementById('action-in-progress')
      if (progressIndicator) {
        progressIndicator.style.display = "block"
      }
      sendCreatePassRequest(
        this.props.absoluteURL,
        walletAddress,
        emailAddress, 
        nft
      ).then(response => {
        if (progressIndicator) {
          progressIndicator.style.display = "none"
        }
        if (response.status === 200) {
          const confirmBox = document.getElementById('action-confirm')
          if (confirmBox) {
            confirmBox.style.display = "block"
          }
        } else {
          // TODO: Show error
        }
      })
    } else {
      this.showEmailInputError("Please, enter a valid email address")
    }
  }

  showEmailInputError(errorMessage: string) {
    const errorLabel = document.getElementById('error-info')
    if (errorLabel) {
      errorLabel.innerHTML = errorMessage
    }
  }

  clearErrors() {
    const errorLabel = document.getElementById('error-info')
    if (errorLabel) {
      errorLabel.innerHTML = ""
    }
  }

  getCachedNFTMetadata(nft: NFT): NFTMetaData | undefined {
    return this.state.nftsMetaData[nft.token_address+":"+nft.token_id]
  }

  getNFTImageURL(nft: NFT): string {
    const metaData = this.getCachedNFTMetadata(nft)
    const placeholderUrl = "https://i.ibb.co/4Fqw7b6/missing-Image.png"
    if (metaData) {
      return normaliseURL(metaData.image_url || metaData.image || placeholderUrl)
    } else {
      return placeholderUrl
    }
  }

  renderNFT(nft: NFT) {
    return (
      <div 
        className="w-full hover:shadow-md hover:shadow-orange-300/50 bg-slate-200 p-2 rounded-xl font-sans font-light"
      >
      
      <div className="w-full h-4/5 rounded-xl shadow-inner bg-slate-300 mb-6">
      <img className="p-1 h-4/5 w-full object-cover hover:object-contain rounded-xl" id="nft_artwork" src={this.getNFTImageURL(nft)}></img>
      <div className="w-full pt-4 pb-4 pl-2 items-center text-left text-xs text-slate-700 font-semibold font-sans flex flex-col">
      <div className="w-full flex items-center justify-items-start">
      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
</svg><div className="font-sans font-semibold">{this.getCachedNFTMetadata(nft)?.name}</div></div>
<div className="w-full text-left font-sans font-light text-slate-600 flex items-center">
<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
</svg> <div className="truncate">{this.getCachedNFTMetadata(nft)?.description}</div></div>

        </div>
      </div>
        
        <div 
          className=""
          onClick={() => {
            this.sendCreateCouponRequest(nft)
          }}
        >
          <div className="p-4 bg-orange-300 hover:shadow-md cursor-pointer rounded-md text-slate-700 font-sans font-semibold">Send</div>
        </div>
      </div>
    );
  }

  render(): React.ReactNode {
    return (
      <div className="w-full p-2 md:w-2/3 mx-auto">
        <div className="uppercase bg-navy pt-2 sticky top-0 flex flex-wrap md:flex-nowrap items-start text-left text-slate-300 font-sans">
        <div className="text-sm p-2 md:p-0 text-center md:text-left">
        Choose the NFT you want to send to your phone via email
        </div>
        <div className="w-full mb-2 ml-2 p-2 rounded-md flex items-center border bg-white">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
</svg>
          <input 
            className="w-full ml-2 p-2 rounded-md text-slate-700" 
            placeholder="Your email address." 
            type="text" 
            id="email-input"
            onChange={() => {
              this.clearErrors()
            }}
          />
        </div>
        <p id="error-info"></p>
        </div>
        <div className="mt-4 grid gap-2 grid-cols-1 md:grid-cols-3 lg:grid-cols-4">
          {this.state.isLoadingNFTs ?
            <div 
            className="w-full hover:shadow-md hover:shadow-orange-300/50 bg-slate-200 p-2 rounded-xl font-sans font-light animate-pulse"
          >
          <div className="w-full rounded-xl shadow-inner bg-slate-300 mb-6 animate-pulse"> Fetching NFTs
          <img className="p-1 h-64 rounded-xl" id="nft_artwork"></img>
          <div className="flex pt-4 pb-4 pl-2 items-center text-left text-xs text-slate-700 font-semibold font-sans">
            </div>
          </div>
            <div>
              <div className="p-4 bg-slate-300 hover:shadow-md cursor-pointer rounded-md text-slate-700 font-sans font-semibold animate-pulse"></div>
            </div>
          </div>
            :
            this.state.nfts.length > 0 ?
              this.state.nfts.map(nft =>
                this.renderNFT(nft)
              )
              : "No NFTs" 
          }
        </div>
        <div className="w-full fixed inset-0 backdrop-blur-lg rounded-xl flex items-center justify-center" id="action-in-progress" style={{display: 'none' }}><div className="w-1/2 mx-auto mt-6 md:mt-10 bg-slate-200 sticky p-10 rounded-xl flex flex-col items-center font-sans font-semibold"><div className="animate-spin"><svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
</svg></div>Your NFT is being transformed into an Apple Wallet Pass. Please wait!</div></div>
<div className="w-full sticky inset-0 p-10 rounded-xl bg-green-200 font-sans font-semibold flex items-center justify-center" id="action-confirm" style={{display: 'none' }}> <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
</svg>Your Apple Pass was sent successfuly!</div>
      </div>
    );
  }
}
