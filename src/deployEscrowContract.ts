import {Address, Cell, TonClient, StateInit, Message, CommonMessageInfo, InternalMessage, toNano, createWalletTransferV3, WalletContract, WalletV3R2Source} from "ton";
import {mnemonicToWalletKey} from "ton-crypto";
import {buildEscrowCodeCell, buildEscrowDataCell, escrowData} from '../test/escrow.data'
import endpoints from '../endpoints.config'


let client = new TonClient({
    endpoint: 'https://toncenter.com/api/v2/jsonRPC',
    apiKey: endpoints.API_KEY
})

export async function deployEscrowContract(amount?: number, royalty_percentage?: number, guarantor_address?: string, seller_address?: string, buyer_address?: string, mnemonicString?: string) {

    let mnemonic: string[] = []

    if (mnemonicString) {
        mnemonic = mnemonicString.split(' ')
    } else {
        mnemonic = endpoints.MNEMONIC
    }

    amount !== undefined ? amount : amount = 1
    royalty_percentage !== undefined ? royalty_percentage : royalty_percentage = 15
    guarantor_address !== undefined ?  guarantor_address : guarantor_address = 'EQCgpwBxV9YjIAl3LZ8MJq3sdEuS3LF6EhIeC3jrTUIo4Cue'
    seller_address !== undefined ? seller_address : seller_address = 'EQCgpwBxV9YjIAl3LZ8MJq3sdEuS3LF6EhIeC3jrTUIo4Cue'
    buyer_address !== undefined ? buyer_address : buyer_address = 'EQCgpwBxV9YjIAl3LZ8MJq3sdEuS3LF6EhIeC3jrTUIo4Cue'

    const keyPair = await mnemonicToWalletKey(mnemonic);

    const wallet = WalletContract.create(client, WalletV3R2Source.create({
        publicKey: keyPair.publicKey,
        workchain: 0
    }))

    const guarantor: Address = Address.parseFriendly(guarantor_address!).address;
    const seller: Address = Address.parseFriendly(seller_address!).address;
    const buyer: Address = Address.parseFriendly(buyer_address!).address;

    const config: escrowData = {
        amount: toNano(amount + 0.2),
        royalty_percentage: royalty_percentage!,
        is_deal_ended: false,
        guarantor_address: guarantor,
        seller_address: seller,
        buyer_address: buyer,
    }

    const codeCell: Cell = buildEscrowCodeCell();

    const dataCell: Cell = buildEscrowDataCell(config)

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

    const messageInfoCell: Cell = new Cell();
    messageInfo.writeTo(messageInfoCell);

    let seqno = await wallet.getSeqNo();

    const transfer = createWalletTransferV3({
        seqno: seqno,
        secretKey: keyPair.secretKey,
        sendMode: 3,
        order: new InternalMessage({
            to: escrowContractAddress,
            value: toNano(0.05),
            bounce: false,
            body: messageInfo
        }),
        walletId: 698983191,
    })

    const sendMessage = await client.sendExternalMessage(wallet, transfer);

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

//deployEscrowContract()