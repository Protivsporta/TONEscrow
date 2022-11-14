import {Address, Cell, TonClient, StateInit, Message, CommonMessageInfo, InternalMessage, toNano, createWalletTransferV3, WalletContract, WalletV3R2Source } from "ton";
import { mnemonicToWalletKey } from "ton-crypto";

let client = new TonClient({
    endpoint: 'https://toncenter.com/api/v2/jsonRPC',
    apiKey: '41024ba3a6c66ef288d64dd570849e4a9b68fe9e21a69aa52e23cc20d6a1f12d'
})

// Contract address - EQCgpwBxV9YjIAl3LZ8MJq3sdEuS3LF6EhIeC3jrTUIo4Cue

// Escrow contract HEX
const contractCodeHex = 'b5ee9c724101070100e8000114ff00f4a413f4bcf2c80b0102016202030202cd04050025a0df8dda89a1a67fa63fa601f481f481f4806101f7d1998e8698198fd201876a268699fe98fe9807d207d207d201828b16382f970c883698f98106000471218189140325482115438400864658293e78b117d0165b564b8fd8009d0a81a38a189f803f0106000c71218189140325482115438400864658293678b117d0165b564b8fd8009d0a81a38a189f803f0361999c06002df02e4659f8a658f89658000e78b00e78b00e78b64f6aa4004402c0028e17f2e192708010c8cb0558cf1621fa02cb6ac98100a0fb00e05b840ff2f08b6f68e5';

async function deployEscrowContract(amount: number, royalty_percentage: number, guarantor_address: string, seller_address: string, buyer_address: string, mnemonicString?: string) {

    let mnemonic: string[] = []

    if (mnemonicString) {
        mnemonic = mnemonicString.split(' ')
    } else {
        mnemonic = [
            'entire',  'consider', 'anchor',
            'artist',  'cruel',    'must',
            'common',  'mosquito', 'stamp',
            'wide',    'flag',     'gift',
            'board',   'library',  'anchor',
            'beyond',  'select',   'burst',
            'exile',   'tomorrow', 'soul',
            'alcohol', 'forward',  'first'
          ]
    }

    const guarantor: Address = Address.parseFriendly(guarantor_address).address;
    const seller: Address = Address.parseFriendly(seller_address).address;
    const buyer: Address = Address.parseFriendly(buyer_address).address;

    const keyPair = await mnemonicToWalletKey(mnemonic);

    const wallet = WalletContract.create(client, WalletV3R2Source.create({
        publicKey: keyPair.publicKey,
        workchain: 0
    }))
    
    const codeCell: Cell =  Cell.fromBoc(contractCodeHex)[0]; 

    const dataCell: Cell = new Cell;
    dataCell.bits.writeUint(amount, 64);
    dataCell.bits.writeUint(royalty_percentage, 32);
    dataCell.bits.writeUint(0, 1);
    dataCell.bits.writeAddress(guarantor);
    dataCell.bits.writeAddress(seller);
    dataCell.bits.writeAddress(buyer);

    const stateInit: Message = new StateInit({
        code: codeCell,
        data: dataCell
    }) 

    let stateInitCell: Cell = new Cell();
    stateInit.writeTo(stateInitCell);
    let stateInitHash = stateInitCell.hash();
    const escrowContractAddress = new Address(0, stateInitHash);

    console.log(escrowContractAddress)


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

    setTimeout(checkContractDeployed, 15000)

    async function checkContractDeployed () {
        try {        
            const contractState = (await client.getContractState(escrowContractAddress)).state;
            if (contractState == "active") {
                console.log(`Escrow contract was deployed to address ${escrowContractAddress.toFriendly()}`)
            }
        } catch (e) {
            throw new Error('Contract state after deploy is not active')
        }   
    }
}

deployEscrowContract(16, 10, 'EQCgpwBxV9YjIAl3LZ8MJq3sdEuS3LF6EhIeC3jrTUIo4Cue', 'EQCgpwBxV9YjIAl3LZ8MJq3sdEuS3LF6EhIeC3jrTUIo4Cue', 'EQCgpwBxV9YjIAl3LZ8MJq3sdEuS3LF6EhIeC3jrTUIo4Cue');