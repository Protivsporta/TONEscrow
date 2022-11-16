import {Address, Cell, TonClient, StateInit, Message, CommonMessageInfo, InternalMessage, toNano, createWalletTransferV3, WalletContract, WalletV3R2Source} from "ton";
import {mnemonicToWalletKey} from "ton-crypto";
import {buildEscrowCodeCell, buildEscrowDataCell, escrowData} from '../test/escrow.data'
import endpoints from '../endpoints.config'


let client = new TonClient({
    endpoint: 'https://toncenter.com/api/v2/jsonRPC',
    apiKey: endpoints.API_KEY
})

let defaultConfig: escrowData = {
    amount: toNano(1),
    royalty_percentage: 15,
    is_deal_ended: false,
    guarantor_address: Address.parseFriendly("EQCgpwBxV9YjIAl3LZ8MJq3sdEuS3LF6EhIeC3jrTUIo4Cue").address,
    seller_address: Address.parseFriendly("EQCgpwBxV9YjIAl3LZ8MJq3sdEuS3LF6EhIeC3jrTUIo4Cue").address,
    buyer_address: Address.parseFriendly("EQCgpwBxV9YjIAl3LZ8MJq3sdEuS3LF6EhIeC3jrTUIo4Cue").address
}

export async function deployEscrowContract(config?: escrowData, mnemonicString?: string) {

    let mnemonic: string[] 

    mnemonicString !== undefined ?  mnemonic = mnemonicString.split(' ') :  mnemonic = endpoints.MNEMONIC

    const keyPair = await mnemonicToWalletKey(mnemonic);

    const wallet = WalletContract.create(client, WalletV3R2Source.create({
        publicKey: keyPair.publicKey,
        workchain: 0
    }))

    let data: escrowData

    config ? data = config : data = defaultConfig

    const codeCell: Cell = buildEscrowCodeCell();

    const dataCell: Cell = buildEscrowDataCell(data)

    const stateInit: Message = new StateInit({
        code: codeCell,
        data: dataCell
    }) 

    let stateInitCell: Cell = new Cell();
    stateInit.writeTo(stateInitCell);
    let stateInitHash = stateInitCell.hash();
    const escrowContractAddress = new Address(0, stateInitHash);

    const messageInfo: CommonMessageInfo = new CommonMessageInfo({
        stateInit: stateInit,
    })

    let seqno = await wallet.getSeqNo();

    const transfer = createWalletTransferV3({
        seqno: seqno,
        secretKey: keyPair.secretKey,
        sendMode: 3,
        order: new InternalMessage({
            to: escrowContractAddress,
            value: data.amount.add(toNano(0.2)),
            bounce: false,
            body: messageInfo
        }),
        walletId: 698983191,
    })

    const sendMessage = await client.sendExternalMessage(wallet, transfer);

    // Set timeout to get updated state of deployed contract
    setTimeout(checkContractDeployed, 20000)

    async function checkContractDeployed () {
        try {        
            const contractState = (await client.getContractState(escrowContractAddress)).state;
            if (contractState == "active") {
                console.log(`Escrow contract was deployed to address ${escrowContractAddress.toFriendly()}`)
            } else {
                throw new Error('Contract state after deploy is not active')
            }
            return false
        } catch (e) {
            throw new Error('Contract state after deploy is not active')
        }   
    } 

    return escrowContractAddress.toFriendly()
}

exports.deployEscrowContract = deployEscrowContract;

