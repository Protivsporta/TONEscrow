import {Address, Cell, TonClient, toNano, fromNano} from "ton";
import endpoints from '../endpoints.config'
import {EscrowDataResponse, EscrowLocal} from '../test/escrowLocal'
import {SmartContract} from "ton-contract-executor"

let client = new TonClient({
    endpoint: 'https://toncenter.com/api/v2/jsonRPC',
    apiKey: endpoints.API_KEY
})

let defaultConfig: EscrowDataResponse = {
    amount: toNano(1),
    royalty_percentage: 15,
    is_deal_ended: false,
    guarantor_address: Address.parseFriendly("EQCgpwBxV9YjIAl3LZ8MJq3sdEuS3LF6EhIeC3jrTUIo4Cue").address,
    seller_address: Address.parseFriendly("EQCgpwBxV9YjIAl3LZ8MJq3sdEuS3LF6EhIeC3jrTUIo4Cue").address,
    buyer_address: Address.parseFriendly("EQCgpwBxV9YjIAl3LZ8MJq3sdEuS3LF6EhIeC3jrTUIo4Cue").address
}


export async function checkSCData(escrowAddress: string, is_deal_ended?: Boolean, checkState?: Boolean, config?: EscrowDataResponse) : Promise<Boolean> {

    config !== undefined ? config : config = defaultConfig

    const contractAddress = Address.parse(escrowAddress);

    let state = await client.getContractState(contractAddress)

    // If checkState flag is recieved, we need to check only contract state
    if (checkState) {
        if (state.state == 'uninitialized') {
            return true
        } else {
            throw new Error('Contract is not destroyed')
        }
    }

    let code = Cell.fromBoc(state.code!)[0]
    let data = Cell.fromBoc(state.data!)[0]

    let escrow = await SmartContract.fromCell(code, data)

    let escrowLocal = new EscrowLocal(escrow, contractAddress)

    let escrowData: EscrowDataResponse = await escrowLocal.getEscrowData();

    // If is_deal_ended flag is recieved we need to check only is_deal_ended flag
    if (is_deal_ended) {
        if (is_deal_ended != escrowData.is_deal_ended) {
            throw new Error("Is deal ended flag is not OK")
        } else {
            return true
        }
    } else {
        is_deal_ended = defaultConfig.is_deal_ended
    }


    if (defaultConfig.amount.toString() !== escrowData.amount.toString()) {
        throw new Error("Amount is not OK")
    } 

    if (defaultConfig.royalty_percentage != escrowData.royalty_percentage) {
        throw new Error("Royalties percentage is not OK")
    }

    if (is_deal_ended != escrowData.is_deal_ended) {
        throw new Error("Is deal ended flag is not OK")
    }

    if (defaultConfig.guarantor_address.toString() != escrowData.guarantor_address.toString()) {
        throw new Error("Guarantor address is not OK")
    }

    if (defaultConfig.seller_address.toString() != escrowData.seller_address.toString()) {
        throw new Error("Seller address is not OK")
    }

    if (defaultConfig.buyer_address.toString() != escrowData.buyer_address.toString()) {
        throw new Error("Buyer address is not OK")
    }

    console.log('Checking contract process is success')
    
    return true 
}

exports.checkSCData = checkSCData;
