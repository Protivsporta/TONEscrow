import {Address, Cell, TonClient, StateInit, contractAddress} from "ton";
import {SmartContract} from "ton-contract-executor";
import arrayBufferToHex from 'array-buffer-to-hex';
import {EscrowLocal} from './escrowLocal'
import BN from "bn.js";

// Escrow contract HEX
const contractCodeHex = 'b5ee9c724101070100e8000114ff00f4a413f4bcf2c80b0102016202030202cd04050025a0df8dda89a1a67fa63fa601f481f481f4806101f7d1998e8698198fd201876a268699fe98fe9807d207d207d201828b16382f970c883698f98106000471218189140325482115438400864658293e78b117d0165b564b8fd8009d0a81a38a189f803f0106000c71218189140325482115438400864658293678b117d0165b564b8fd8009d0a81a38a189f803f0361999c06002df02e4659f8a658f89658000e78b00e78b00e78b64f6aa4004402c0028e17f2e192708010c8cb0558cf1621fa02cb6ac98100a0fb00e05b840ff2f08b6f68e5';

export type escrowData = {
    amount: BN,
    royalty_percentage: number,
    is_deal_ended: boolean,
    guarantor_address: Address,
    seller_address: Address,
    buyer_address: Address,
}

export function buildEscrowDataCell(data: escrowData): Cell {
    let dataCell = new Cell()

    dataCell.bits.writeUint(data.amount, 64);
    dataCell.bits.writeUint(data.royalty_percentage, 32);
    dataCell.bits.writeUint(0, 1);
    dataCell.bits.writeAddress(data.guarantor_address);
    dataCell.bits.writeAddress(data.seller_address);
    dataCell.bits.writeAddress(data.buyer_address);

    return dataCell
}

export function buildEscrowCodeCell(): Cell {
    let codeCell: Cell = Cell.fromBoc(contractCodeHex)[0];
    return codeCell
}

export function buildEscrowStateInit(data: escrowData) {
    let dataCell = buildEscrowDataCell(data)

    let codeCell: Cell = buildEscrowCodeCell(); 

    let stateInit = new StateInit({
        code: codeCell,
        data: dataCell
    })

    let stateInitCell = new Cell()
    stateInit.writeTo(stateInitCell)

    let address = contractAddress({workchain: 0, initialCode: codeCell, initialData: dataCell})

    return {
        stateInit: stateInitCell,
        stateInitMessage: stateInit,
        address
    }
}

export const OperationCodes = {
    TrasferMoneyToSeller: 0,
    TransferMoneyBackToBuyer: 1,
    TransferRoyaliesToGuarantor: 2,
}