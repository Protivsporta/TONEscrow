import {SmartContract} from "ton-contract-executor";
import {Address, Cell, CellMessage, CommonMessageInfo, InternalMessage, Slice, toNano, contractAddress} from "ton";
import BN from "bn.js";
import {escrowData, OperationCodes, buildEscrowCodeCell, buildEscrowDataCell} from './escrow.data'

export type EscrowDataResponse = { 
    amount: BN, 
    royalty_percentage: number, 
    is_deal_ended: boolean, 
    guarantor_address: Address, 
    seller_address: Address, 
    buyer_address: Address
}

export class EscrowLocal {

    constructor(
        public readonly contract: SmartContract,
        public readonly address: Address
    ) {

    }

    // Get method

    async getEscrowData() : Promise<EscrowDataResponse> {
        let res = await this.contract.invokeGetMethod('get_contract_data_full', [])

        if (res.type !== 'success') {
            throw new Error("Can't invoke get_contract_data method")
        }

        let [amount, royalty_percentage_BN, is_deal_ended_BN, guarantor_address_slice, seller_address_slice, buyer_address_slice] = res.result as [BN, BN, BN, Slice, Slice, Slice]

        let royalty_percentage: number = Number(royalty_percentage_BN);
        let is_deal_ended: boolean = Boolean(Number(is_deal_ended_BN));
        let guarantor_address: Address = guarantor_address_slice.readAddress()!
        let seller_address: Address = seller_address_slice.readAddress()!
        let buyer_address: Address = buyer_address_slice.readAddress()!

        return{
            amount,
            royalty_percentage,
            is_deal_ended,
            guarantor_address,
            seller_address,
            buyer_address,
        }
    }

    // Send signed message with op = 0 (transfer to seller)
    
    async sendMoneyToSeller(from: Address) {
        let msgBody = new Cell()
        msgBody.bits.writeUint(OperationCodes.TrasferMoneyToSeller, 32)
        msgBody.bits.writeUint(0, 64)

        return await this.contract.sendInternalMessage(new InternalMessage({
            to: this.address,
            from: from,
            value: toNano(1),
            bounce: false,
            body: new CommonMessageInfo({
                body: new CellMessage(msgBody)
            })
        }))
    }

    // Send signed message with op = 1 (transfer back to buyer)

    async sendMoneyBackToBuyer(from: Address) {
        let msgBody = new Cell()
        msgBody.bits.writeUint(OperationCodes.TransferMoneyBackToBuyer, 32)
        msgBody.bits.writeUint(0, 64)

        return await this.contract.sendInternalMessage(new InternalMessage({
            to: this.address,
            from: from,
            value: toNano(1),
            bounce: false,
            body: new CommonMessageInfo({
                body: new CellMessage(msgBody)
            })
        }))
    }

    // Send signed message with op = 2 (transfer royalties to guarantor)

    async sendRoyaltiesToGuarantor(from: Address) {
        let msgBody = new Cell()
        msgBody.bits.writeUint(OperationCodes.TransferRoyaliesToGuarantor, 32)
        msgBody.bits.writeUint(0, 64)

        return await this.contract.sendInternalMessage(new InternalMessage({
            to: this.address,
            from: from,
            value: toNano(1),
            bounce: false,
            body: new CommonMessageInfo({
                body: new CellMessage(msgBody)
            })
        }))
    }

    // Generate escrow contract from config

    static async createFromConfig(config: escrowData) {
        let codeCell: Cell = buildEscrowCodeCell()
        let dataCell: Cell = buildEscrowDataCell(config)

        let contract = await SmartContract.fromCell(codeCell, dataCell);

        let address = contractAddress({
            workchain: 0,
            initialCode: contract.codeCell,
            initialData: contract.dataCell
        })

        contract.setC7Config({
            myself: address
        })

        return new EscrowLocal(contract, address)
    }
}

