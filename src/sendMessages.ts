import {Address, Cell, TonClient, CommonMessageInfo, InternalMessage, toNano, createWalletTransferV3, WalletContract, WalletV3R2Source, CellMessage} from "ton";
import {mnemonicToWalletKey} from "ton-crypto";
import endpoints from '../endpoints.config'

let client = new TonClient({
    endpoint: 'https://toncenter.com/api/v2/jsonRPC',
    apiKey: endpoints.API_KEY
})

let defaultConfig = {
    mnemonic: endpoints.MNEMONIC,
    address_to: 'EQDHGYxxhrWBhVql9S5FuD8LcL2uR5flOApiALAKjmgp5HaW'
}

export async function sendTransactionToEscrow(opcode:number, address_to?: string, mnemonicString?: string) {

    let mnemonic: string[] 

    mnemonicString !== undefined ?  mnemonic = mnemonicString.split(' ') :  mnemonic = defaultConfig.mnemonic
    address_to !== undefined ? address_to : address_to = defaultConfig.address_to

    const keyPair = await mnemonicToWalletKey(mnemonic);

    const wallet = WalletContract.create(client, WalletV3R2Source.create({
        publicKey: keyPair.publicKey,
        workchain: 0
    }))

    const escrowContractAddress: Address = Address.parse(address_to)

    let msgBody = new Cell()
    msgBody.bits.writeUint(opcode, 32)
    msgBody.bits.writeUint(0, 64)

    let seqno = await wallet.getSeqNo();

    const transfer = createWalletTransferV3({
        seqno: seqno,
        secretKey: keyPair.secretKey,
        sendMode: 3,
        order: new InternalMessage({
            to: escrowContractAddress,
            value: toNano(0.01),
            bounce: false,
            body: new CommonMessageInfo({
                body: new CellMessage(msgBody)
            })
        }),
        walletId: 698983191,
    })

    const sendMessage = await client.sendExternalMessage(wallet, transfer);
}

exports.sendTransactionToEscrow = sendTransactionToEscrow
